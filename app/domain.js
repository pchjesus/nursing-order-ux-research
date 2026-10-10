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
 state.orders.forEach(o=>{assert(patient(fixtures,o.patientId)&&item(fixtures,o.code)&&VALID_STATUSES.includes(o.status),'처방 참조/상태 오류');assert(actor(fixtures,o.orderedBy),'처방자 없음');if(o.checkedBy)assert(actor(fixtures,o.checkedBy),'확인자 없음');if(o.schedule!==undefined)validateSchedule(o.schedule,o.id);if(o.details!==undefined){const d=cleanDetails(fixtures,o.code,o.details);assert(d&&typeof o.details.productName==='string'&&o.details.productName.length<=160&&typeof o.details.productKind==='string'&&o.details.productKind.length<=120,'제품 정보 스냅샷의 형식이 올바르지 않습니다.');}});
 state.executions.forEach(e=>{let o=state.orders.find(x=>x.id===e.orderId);assert(o&&o.patientId===e.patientId,'수행의 환자·처방 불일치');if(e.slotId!==undefined)assert(typeof e.slotId==='string'&&o.schedule?.slots.some(s=>s.id===e.slotId),'수행-예정 시점 참조 오류');});
 state.records.forEach(d=>{let o=state.orders.find(x=>x.id===d.orderId);assert(o&&o.patientId===d.patientId,'기록의 환자·처방 불일치');});
 state.links.forEach(l=>{let e=state.executions.find(x=>x.id===l.executionId),d=state.records.find(x=>x.id===l.recordId);assert(e&&d&&e.orderId===d.orderId,'수행-기록 링크 오류');});
 /* Optional v0.2.6 slot audit fields; older audit records are left untouched. */
 state.audit.filter(a=>SLOT_AUDIT_ACTIONS.includes(a.action)).forEach(a=>{
  const order=state.orders.find(o=>o.id===a.orderId);
  assert(order&&actor(fixtures,a.by)&&order.schedule?.slots.some(s=>s.id===a.slotId),'예정 감사 이력의 처방/수행자/슬롯 참조 오류');
  assert(typeof a.note==='string'&&a.note.trim().length>=2&&a.note.length<=200,'예정 감사 사유 오류');
  isoTime(a.at);
  if(a.action==='slot_postponed'){isoTime(a.oldAt);isoTime(a.newAt);assert(Date.parse(a.newAt)>Date.parse(a.oldAt),'연기 감사 시각 오류');}
  else assert(SLOT_STATES.includes(a.fromStatus)&&SLOT_STATES.includes(a.toStatus),'예정 상태 감사 이력 오류');
 });
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

/* Optional v0.2.5 synthetic schedule: immutable planned slots, separate from actual executions. */
const SCHEDULE_KINDS=['once','interval','conditional'];
const SLOT_STATES=['planned','held','cancelled'];
const SLOT_AUDIT_ACTIONS=['slot_held','slot_resumed','slot_cancelled','slot_postponed'];
function isoTime(value){
 assert(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value,'예정 시각은 유효한 ISO 시각이어야 합니다.');
 return value;
}
function buildSchedule(spec,orderId){
 if(spec===null||spec===undefined||spec.kind==='unspecified')return null;
 assert(spec&&typeof spec==='object'&&!Array.isArray(spec)&&SCHEDULE_KINDS.includes(spec.kind),'예정 유형이 올바르지 않습니다.');
 if(spec.kind==='conditional'){
  const condition=String(spec.condition||'').trim();
  assert(condition.length>=2&&condition.length<=160,'조건부 수행 조건은 2~160자로 입력해 주세요.');
  return {kind:'conditional',condition,slots:[]};
 }
 const startAt=isoTime(spec.startAt);
 const count=spec.kind==='once'?1:Number(spec.count);
 const everyHours=spec.kind==='interval'?Number(spec.everyHours):null;
 assert(Number.isInteger(count)&&count>=1&&count<=24&&(spec.kind!=='interval'||count>=2),'반복 횟수는 2~24회입니다.');
 if(spec.kind==='interval')assert(Number.isInteger(everyHours)&&everyHours>=1&&everyHours<=48,'반복 간격은 1~48시간입니다.');
 const slots=Array.from({length:count},(_,i)=>({
  id:orderId+'-S'+String(i+1).padStart(3,'0'),
  at:new Date(Date.parse(startAt)+i*(everyHours||0)*3600000).toISOString(),
  status:'planned'
 }));
 return {kind:spec.kind,...(spec.kind==='interval'?{everyHours}:{}),slots};
}
function validateSchedule(schedule,orderId){
 assert(schedule&&typeof schedule==='object'&&!Array.isArray(schedule)&&SCHEDULE_KINDS.includes(schedule.kind)&&Array.isArray(schedule.slots),'예정 데이터 구조 오류');
 const slots=schedule.slots;
 assert(slots.length<=(24),'예정 시점은 최대 24개입니다.');
 if(schedule.kind==='conditional'){
  assert(typeof schedule.condition==='string'&&schedule.condition.trim().length>=2&&schedule.condition.length<=160&&slots.length===0,'조건부 예정 정보 오류');
 }else{
  assert(slots.length>=(schedule.kind==='once'?1:2)&&(schedule.kind!=='once'||slots.length===1),'예정 시점 개수 오류');
  if(schedule.kind==='interval')assert(Number.isInteger(schedule.everyHours)&&schedule.everyHours>=1&&schedule.everyHours<=48,'예정 반복 간격 오류');
 }
 const ids=new Set();
 for(let i=0;i<slots.length;i++){
  const slot=slots[i];
  assert(slot&&slot.id===orderId+'-S'+String(i+1).padStart(3,'0')&&!ids.has(slot.id)&&SLOT_STATES.includes(slot.status),'예정 ID 또는 상태 오류');
  isoTime(slot.at);if(slot.rescheduledAt!==undefined){isoTime(slot.rescheduledAt);assert(Date.parse(slot.rescheduledAt)>Date.parse(slot.at),'연기 시각은 최초 예정 시각 이후여야 합니다.');}ids.add(slot.id);
  if(schedule.kind==='interval'&&i>0)assert(Date.parse(slot.at)-Date.parse(slots[i-1].at)===schedule.everyHours*3600000,'반복 간격과 예정 시점 불일치');
 }
 return true;
}
function scheduleOverview(state,order){
 const events=state.executions.filter(e=>e.orderId===order.id);
 const known=!!order.schedule,conditional=order.schedule?.kind==='conditional';
 const slots=(order.schedule?.slots||[]).map(slot=>{
  const executions=events.filter(e=>e.slotId===slot.id);
  const executionIds=new Set(executions.map(e=>e.id));
  const recordIds=new Set(state.links.filter(l=>executionIds.has(l.executionId)).map(l=>l.recordId));
  const records=state.records.filter(r=>r.orderId===order.id&&recordIds.has(r.id));
  return {...slot,effectiveAt:slot.rescheduledAt||slot.at,executions,records};
 });
 return {kind:order.schedule?.kind||'unspecified',condition:order.schedule?.condition||'',
  planned:!known||conditional?null:slots.length,slots,unassigned:events.filter(e=>!e.slotId).length};
}

function createDraft(fixtures,state,session,patientId,code,note='',details=null,scheduleSpec=null){
 ensureSession(fixtures,session); assert(patient(fixtures,patientId),'가상 환자를 찾을 수 없습니다.');assert(item(fixtures,code),'간호활동(ACT)만 선택할 수 있습니다.');
 const canonical=cleanDetails(fixtures,code,details);
 const next=clone(state); let order={id:uid('O'),patientId,code,status:'draft',orderedBy:session.userId,checkedBy:null,createdAt:stamp(),confirmedAt:null,shift:session.shift,note:String(note).slice(0,200)};
 if(canonical!==null)order.details=canonical;
 const schedule=buildSchedule(scheduleSpec,order.id);if(schedule)order.schedule=schedule;
 next.orders.push(order);next.audit.push({id:uid('AUD'),orderId:order.id,action:'draft_saved',by:session.userId,at:stamp()});return {next,order};
}
function confirmDraft(fixtures,state,session,orderId,pin){
 ensureSession(fixtures,session);assert(authenticate(fixtures,session.userId,session.shift,pin),'비밀번호가 일치하지 않습니다.');
 const next=clone(state);const order=next.orders.find(x=>x.id===orderId);assert(order,'처방을 찾을 수 없습니다.');assert(order.status==='draft','임시저장된 처방만 확정할 수 있습니다.');assert(order.orderedBy===session.userId,'처방을 저장한 계정만 이번 데모에서 재인증할 수 있습니다.');
 order.status='confirmed';order.checkedBy=session.userId;order.confirmedAt=stamp();next.audit.push({id:uid('AUD'),orderId,action:'reauth_confirmed',by:session.userId,at:order.confirmedAt});return next;
}

/* Conservative demo-only transitions: slot IDs and original 'at' timestamps never change. */
function changeSlot(fixtures,state,session,orderId,slotId,action,reason,pin,newAt=null){
 ensureSession(fixtures,session);
 assert(authenticate(fixtures,session.userId,session.shift,pin),'비밀번호가 일치하지 않습니다.');
 assert(typeof reason==='string'&&reason.trim().length>=2&&reason.trim().length<=200,'변경 사유는 2~200자로 입력해 주세요.');
 assert(['hold','resume','cancel','postpone'].includes(action),'지원하지 않는 예정 변경 동작입니다.');
 const order=state.orders.find(o=>o.id===orderId);
 assert(order&&order.status==='confirmed','확정된 처방의 예정만 모의 변경할 수 있습니다.');
 const slot=order.schedule?.slots.find(s=>s.id===slotId);
 assert(slot,'해당 처방의 예정 슬롯이 아닙니다.');
 assert(!state.executions.some(e=>e.orderId===orderId&&e.slotId===slotId),'수행 사건이 연결된 예정은 변경할 수 없습니다.');
 const allowed={hold:['planned'],resume:['held'],cancel:['planned','held'],postpone:['planned','held']};
 assert(allowed[action].includes(slot.status),'현재 예정 상태에서는 해당 변경을 할 수 없습니다.');
 let at=null;
 if(action==='postpone'){
  at=isoTime(newAt);
  assert(Date.parse(at)>Date.parse(slot.rescheduledAt||slot.at),'새 예정 시각은 현재 예정 시각보다 나중이어야 합니다.');
 }
 const next=clone(state),target=next.orders.find(o=>o.id===orderId).schedule.slots.find(s=>s.id===slotId);
 const was=target.status,previousAt=target.rescheduledAt||target.at;
 if(action==='hold')target.status='held';
 if(action==='resume')target.status='planned';
 if(action==='cancel')target.status='cancelled';
 if(action==='postpone')target.rescheduledAt=at;
 const audit={id:uid('AUD'),orderId,slotId,action:({hold:'slot_held',resume:'slot_resumed',cancel:'slot_cancelled',postpone:'slot_postponed'})[action],
  by:session.userId,at:stamp(),note:reason.trim()};
 if(action==='postpone'){audit.oldAt=previousAt;audit.newAt=at;}
 else{audit.fromStatus=was;audit.toStatus=target.status;}
 next.audit.push(audit);
 validate(fixtures,next);
 return {next,slot:target,audit};
}

function addExecution(fixtures,state,session,orderId,note='',slotId=null){
 ensureSession(fixtures,session); const order=state.orders.find(x=>x.id===orderId);assert(order&&order.status==='confirmed','확정된 처방만 모의 수행 기록을 추가할 수 있습니다.');const slot=slotId?order.schedule?.slots.find(s=>s.id===slotId):null;
 assert(!slotId||slot,'이 처방에 속하지 않는 예정 시점입니다.');assert(!slot||slot.status==='planned','보류·취소된 예정 시점은 연결 수행을 추가할 수 없습니다.');
 const next=clone(state);
 const e={id:uid('E'),orderId,patientId:order.patientId,by:session.userId,at:stamp(),note:String(note).slice(0,200)};if(slot)e.slotId=slot.id;next.executions.push(e);next.audit.push({id:uid('AUD'),orderId,action:'simulation_execution_added',by:session.userId,at:e.at});return {next,execution:e};
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
function summary(state,patientId){const data=forPatient(state,patientId);const plans=data.map(x=>scheduleOverview(state,x.order));const slots=plans.flatMap(p=>p.slots);return {orders:data.length,plannedSlots:slots.length,heldSlots:slots.filter(s=>s.status==='held').length,cancelledSlots:slots.filter(s=>s.status==='cancelled').length,activeSlots:slots.filter(s=>s.status==='planned').length,unknownPlans:plans.filter(x=>x.planned===null).length,confirmed:data.filter(x=>x.order.status==='confirmed').length,drafts:data.filter(x=>x.order.status==='draft').length,executions:data.reduce((n,x)=>n+x.executions.length,0),records:data.reduce((n,x)=>n+x.records.length,0)};}
return {STORAGE_KEY,makeSeed,validate,search,authenticate,shiftAllowed,createDraft,confirmDraft,addExecution,addRecord,forPatient,groupPatientOrders,summary,buildSchedule,validateSchedule,scheduleOverview,changeSlot,clone};
});
