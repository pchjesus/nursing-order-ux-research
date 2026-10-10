/* Pure domain logic: intentionally isolated from the replaceable UI. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports) module.exports=api;root.NursingDomain=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const STORAGE_KEY='nursing-order-demo-v02';
const VALID_STATUSES=['draft','confirmed','held','cancelled'];
const uid=(prefix)=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
const stamp=()=>new Date().toISOString();
const clone=(v)=>JSON.parse(JSON.stringify(v));
function assert(c,m){if(!c)throw Error(m);}
function item(fixtures,code){return fixtures.catalog.find(x=>x.code===code && x.type==='ACT');}
function actor(fixtures,id){return fixtures.users.find(x=>x.id===id);}
function patient(fixtures,id){return fixtures.patients.find(x=>x.id===id);}
function shiftAllowed(fixtures,userId,shift){let u=actor(fixtures,userId);return !!u && u.shift===shift;}
function authenticate(fixtures,userId,shift,pin){let u=actor(fixtures,userId);return !!u&&u.shift===shift&&u.pin===String(pin);}
function ensureSession(fixtures,session){assert(session&&shiftAllowed(fixtures,session.userId,session.shift),'선택한 모의 근무조에 로그인한 간호사 계정이 필요합니다.');}
function makeSeed(fixtures){
 const orders=[],executions=[],records=[],links=[],audit=[];
 fixtures.seedOrders.forEach((row,i)=>{
  const [patientId,code,orderedBy,checkedBy,days,done,documented,status]=row;
  assert(patient(fixtures,patientId)&&item(fixtures,code)&&VALID_STATUSES.includes(status),'시드 환자/코드/상태 오류');
  const date=new Date(Date.now()-(days*86400000+i*3600000)).toISOString(); const id='DEMO-O-'+String(i+1).padStart(3,'0');
  orders.push({id,patientId,code,status,orderedBy,checkedBy,createdAt:date,confirmedAt:date,note:'초기 합성 사례',shift:actor(fixtures,orderedBy).shift});
  audit.push({id:uid('AUD'),orderId:id,action:'seed',by:orderedBy,at:date,note:'가상 이력 데이터'});
  for(let j=0;j<done;j++){
   const executionId=`DEMO-E-${i+1}-${j+1}`;
   const at=new Date(new Date(date).getTime()+(j+1)*3600000).toISOString();
   executions.push({id:executionId,orderId:id,patientId,by:checkedBy,at,note:'합성 수행'});
   if(j<documented){let recordId=`DEMO-R-${i+1}-${j+1}`;records.push({id:recordId,patientId,orderId:id,by:checkedBy,at,note:'합성 간호기록',revision:1});links.push({executionId,recordId});}
  }
 });
 return {schema:2,orders,executions,records,links,audit};
}
function validate(fixtures,state){
 assert(state&&state.schema===2,'저장 버전이 다릅니다. 자동 초기화하지 않았습니다.');
 for(const key of ['orders','executions','records','links','audit']) assert(Array.isArray(state[key]),`잘못된 데이터: ${key}`);
 const unique=(arr,k)=>new Set(arr.map(x=>x[k])).size===arr.length;
 for(const key of ['orders','executions','records','audit'])assert(unique(state[key],'id'),`중복 ID: ${key}`);
 state.orders.forEach(o=>{assert(patient(fixtures,o.patientId)&&item(fixtures,o.code)&&VALID_STATUSES.includes(o.status),'처방 참조/상태 오류');assert(actor(fixtures,o.orderedBy),'처방자 없음');if(o.checkedBy)assert(actor(fixtures,o.checkedBy),'확인자 없음');if(o.details!==undefined){const d=cleanDetails(fixtures,o.code,o.details);assert(d&&typeof o.details.productName==='string'&&o.details.productName.length<=160&&typeof o.details.productKind==='string'&&o.details.productKind.length<=120,'제품 정보 스냅샷의 형식이 올바르지 않습니다.');}});
 state.executions.forEach(e=>{let o=state.orders.find(x=>x.id===e.orderId);assert(o&&o.patientId===e.patientId,'수행의 환자·처방 불일치');});
 state.records.forEach(d=>{let o=state.orders.find(x=>x.id===d.orderId);assert(o&&o.patientId===d.patientId,'기록의 환자·처방 불일치');});
 state.links.forEach(l=>{let e=state.executions.find(x=>x.id===l.executionId),d=state.records.find(x=>x.id===l.recordId);assert(e&&d&&e.orderId===d.orderId,'수행-기록 링크 오류');});
 return state;
}
function search(fixtures,q,category){const norm=s=>String(s||'').toLocaleLowerCase('ko').replace(/\s+/g,'').trim(); const term=norm(q);return fixtures.catalog.filter(x=>{
 if(category&&x.category!==category)return false;
 if(!term)return true;
 const p=fixtures.profiles?.[x.code];
 const productTerms=fixtures.productSearchByCode?.[x.code] || (fixtures.products?.filter(z=>p?.families?.includes(z.family)).flatMap(z=>[z.name,z.displayName,z.variant,z.kind,...(z.aliases||[])])||[]);
 return [x.name,x.code,x.category,...x.aliases,...(p?.methods||[]),...productTerms].some(v=>norm(v).includes(term));
});}
function cleanDetails(fixtures,code,value){
 if(value===null||value===undefined)return null; // legacy orders remain valid and unmigrated
 const profile=fixtures.profiles?.[code];
 assert(profile&&value&&typeof value==='object'&&!Array.isArray(value),'세부 조건 참조 구조가 올바르지 않습니다.');
 const fields={site:'sites',purpose:'purposes',frequency:'frequencies',method:'methods'};
 const detail={};
 for(const [field,key] of Object.entries(fields)){
  const v=value[field]??'';
  assert(typeof v==='string'&&v.length<=100,'세부 조건 값의 형식이 올바르지 않습니다.');
  assert(v===''||profile[key].includes(v),'선택한 간호활동에 허용되지 않는 세부 조건입니다.');
  detail[field]=v;
 }
 const productId=value.productId??'';
 assert(typeof productId==='string'&&productId.length<=80,'제품 참조 형식이 올바르지 않습니다.');
 const product=productId?fixtures.products?.find(x=>x.id===productId):null;
 assert(!productId||(product&&profile.families.includes(product.family)),'해당 활동에 연결할 수 없는 제품·기구 후보입니다.');
 if(productId&&['SIM-ACT-0033','SIM-ACT-0043','SIM-ACT-0063'].includes(code)&&product.family==='dressing')assert(productId==='SIM-PRD-003','삽입부 드레싱 활동의 제품 유형이 맞지 않습니다.');
 const method=detail.method;
 if(productId&&method==='인퓨전 펌프 전용세트')assert(product.family==='infusion-pump','인퓨전 펌프 방식과 제품 유형이 일치하지 않습니다.');
 if(productId&&method==='도지플로우(유량조절기형)')assert(product.family==='infusion-flow','유량조절기형 방식과 제품 유형이 일치하지 않습니다.');
 if(productId&&method==='중력식 일반세트')assert(product.family==='infusion-gravity'&&product.id!=='SIM-GEN-003','중력식 일반 방식과 세트 유형이 일치하지 않습니다.');
 if(productId&&method==='미세방울세트')assert(product.id==='SIM-GEN-003','미세방울 세트 유형과 일치하지 않습니다.');
 detail.productId=productId;
 detail.productName=product?.displayName?(product.displayName+(product.variant?' · '+product.variant:'')):(product?.name||''); // stored representative snapshot; legacy exact snapshots remain unchanged
 detail.productKind=product?.kind||'';
 return detail;
}
function createDraft(fixtures,state,session,patientId,code,note='',details=null){
 ensureSession(fixtures,session); assert(patient(fixtures,patientId),'가상 환자를 찾을 수 없습니다.');assert(item(fixtures,code),'간호활동(ACT)만 선택할 수 있습니다.');
 const canonical=cleanDetails(fixtures,code,details);
 const next=clone(state); let order={id:uid('O'),patientId,code,status:'draft',orderedBy:session.userId,checkedBy:null,createdAt:stamp(),confirmedAt:null,shift:session.shift,note:String(note).slice(0,200)};
 if(canonical!==null)order.details=canonical;
 next.orders.push(order);next.audit.push({id:uid('AUD'),orderId:order.id,action:'draft_saved',by:session.userId,at:stamp()});return {next,order};
}
function confirmDraft(fixtures,state,session,orderId,pin){
 ensureSession(fixtures,session);assert(authenticate(fixtures,session.userId,session.shift,pin),'비밀번호가 일치하지 않습니다.');
 const next=clone(state);const order=next.orders.find(x=>x.id===orderId);assert(order,'처방을 찾을 수 없습니다.');assert(order.status==='draft','임시저장된 처방만 확정할 수 있습니다.');assert(order.orderedBy===session.userId,'처방을 저장한 계정만 이번 데모에서 재인증할 수 있습니다.');
 order.status='confirmed';order.checkedBy=session.userId;order.confirmedAt=stamp();next.audit.push({id:uid('AUD'),orderId,action:'reauth_confirmed',by:session.userId,at:order.confirmedAt});return next;
}
function addExecution(fixtures,state,session,orderId,note=''){
 ensureSession(fixtures,session); const order=state.orders.find(x=>x.id===orderId);assert(order&&order.status==='confirmed','확정된 처방만 모의 수행 기록을 추가할 수 있습니다.');const next=clone(state);
 const e={id:uid('E'),orderId,patientId:order.patientId,by:session.userId,at:stamp(),note:String(note).slice(0,200)};next.executions.push(e);next.audit.push({id:uid('AUD'),orderId,action:'simulation_execution_added',by:session.userId,at:e.at});return {next,execution:e};
}
function addRecord(fixtures,state,session,executionId,note){
 ensureSession(fixtures,session); const execution=state.executions.find(x=>x.id===executionId);assert(execution,'해당 수행 사건이 없습니다.');const order=state.orders.find(x=>x.id===execution.orderId);assert(order&&order.status==='confirmed','확정된 처방에서만 기록을 추가할 수 있습니다.');
 const text=String(note||'').trim();assert(text.length>=2&&text.length<=500,'기록 내용은 2~500자로 입력해 주세요.');
 const next=clone(state);const record={id:uid('R'),patientId:execution.patientId,orderId:order.id,by:session.userId,at:stamp(),note:text,revision:1};next.records.push(record);next.links.push({recordId:record.id,executionId});next.audit.push({id:uid('AUD'),orderId:order.id,action:'simulation_record_added',by:session.userId,at:record.at});return {next,record};
}
function forPatient(state,patientId){const orders=state.orders.filter(x=>x.patientId===patientId);return orders.map(o=>({order:o,executions:state.executions.filter(x=>x.orderId===o.id),records:state.records.filter(x=>x.orderId===o.id),audit:state.audit.filter(x=>x.orderId===o.id)}));}
/* Presentation grouping only: never merge order instances or infer clinical equivalence. */
function groupPatientOrders(fixtures,state,patientId,options={}){
 assert(patient(fixtures,patientId),'가상 환자를 찾을 수 없습니다.');
 const statusFilter=String(options.status||'');
 const query=String(options.query||'').trim().toLocaleLowerCase('ko');
 const visible=forPatient(state,patientId).filter(row=>{
  if(statusFilter&&row.order.status!==statusFilter)return false;
  const name=item(fixtures,row.order.code)?.name||'';
  return !query||row.order.code.toLocaleLowerCase('ko').includes(query)||name.toLocaleLowerCase('ko').includes(query);
 }).sort((a,b)=>b.order.createdAt.localeCompare(a.order.createdAt)||a.order.id.localeCompare(b.order.id));
 const groups=new Map();
 for(const row of visible){
  const key=row.order.code;
  if(!groups.has(key))groups.set(key,{patientId,code:key,items:[],executions:0,records:0,statusCounts:{}});
  const group=groups.get(key);
  group.items.push(row);
  group.executions+=row.executions.length;
  group.records+=row.records.length;
  group.statusCounts[row.order.status]=(group.statusCounts[row.order.status]||0)+1;
 }
 return [...groups.values()];
}
function summary(state,patientId){const data=forPatient(state,patientId);return {confirmed:data.filter(x=>x.order.status==='confirmed').length,drafts:data.filter(x=>x.order.status==='draft').length,executions:data.reduce((n,x)=>n+x.executions.length,0),records:data.reduce((n,x)=>n+x.records.length,0)};}
return {STORAGE_KEY,makeSeed,validate,search,authenticate,shiftAllowed,createDraft,confirmDraft,addExecution,addRecord,forPatient,groupPatientOrders,summary,clone};
});
