/* Read-only projection: synthetic nursing Kardex + Order Manage view. No persisted state or cross-app linkage. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.NursingOrderSheet=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x));
 function assert(c,m){if(!c)throw Error(m);}
 function validateCases(fixtures,cases){
  assert(fixtures&&Array.isArray(fixtures.patients)&&Array.isArray(cases),'가상 환자·인계 데이터 형식 오류');
  const ids=new Set(fixtures.patients.map(p=>p.id)), seen=new Set();
  assert(cases.length===ids.size,'모든 합성 환자에 대해 1개의 인계 사례가 있어야 합니다.');
  for(const c of cases){
   assert(c&&ids.has(c.patientId)&&!seen.has(c.patientId),'가상 환자 ID 중복 또는 연결 오류');
   assert(typeof c.scenarioTitle==='string'&&c.scenarioTitle.trim()&&c.scenarioTitle.length<=120,'사례 제목 오류');
   assert(['kardex','focus','skills'].every(k=>Array.isArray(c[k])&&c[k].length>0&&c[k].every(v=>typeof v==='string'&&v.trim()&&v.length<=300)),'인계 항목 배열 오류');
   assert(typeof c.educationSource==='string'&&c.educationSource.length<=240,'교육자료 참조 형식 오류');
   assert(!Object.hasOwn(c,'realPatientId')&&!Object.hasOwn(c,'studentId'),'실제 식별자 입력 금지');
   seen.add(c.patientId);
  }
  return true;
 }
 function dateKey(text){
  if(typeof text!=='string'||!Number.isFinite(Date.parse(text)))return null;
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(text));
 }
 function localTimestamp(text){
  if(typeof text!=='string'||!Number.isFinite(Date.parse(text)))return '시각 미확인';
  return new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(text));
 }
 const STATUS={draft:'임시저장',confirmed:'가상 확정',held:'보류',cancelled:'취소'};
 function buildSheet(fixtures,state,patientId){
  assert(fixtures&&Array.isArray(fixtures.patients)&&fixtures.patients.some(p=>p.id===patientId),'가상 환자를 찾을 수 없습니다.');
  assert(state&&Array.isArray(state.orders)&&Array.isArray(state.executions)&&Array.isArray(state.records),'가상 처방 이력을 읽을 수 없습니다.');
  const catalog=new Map(fixtures.catalog.map(c=>[c.code,c]));
  const staff=new Map(fixtures.users.map(u=>[u.id,u]));
  const groups=new Map();
  const all=state.orders.filter(o=>o.patientId===patientId);
  for(const o of all){
   const original=catalog.get(o.code);assert(original&&original.type==='ACT','간호활동 참조가 올바르지 않습니다.');
   const provenance=o.id.startsWith('DEMO-O-')?'초기 합성 사례':'추가 모의 처방';
   const day=dateKey(o.createdAt)||'시각 미확인';
   const minute=localTimestamp(o.createdAt);
   const key=JSON.stringify([day,minute,o.orderedBy,provenance]);
   if(!groups.has(key))groups.set(key,{key,day,createdLabel:minute,provenance,authorId:o.orderedBy,author:staff.get(o.orderedBy)?.name||'미확인',rows:[]});
   groups.get(key).rows.push({
     orderId:o.id,activityCode:o.code,activityName:original.name,category:original.category,
     status:o.status,statusLabel:STATUS[o.status]||'상태 미확인',createdAt:o.createdAt,createdLabel:minute,
     authorId:o.orderedBy,author:staff.get(o.orderedBy)?.name||'미확인',
     checkerId:o.checkedBy||null,checker:o.checkedBy?(staff.get(o.checkedBy)?.name||'미확인'):'미확인',
     confirmedLabel:o.confirmedAt?localTimestamp(o.confirmedAt):'—',
     executions:state.executions.filter(e=>e.orderId===o.id).length,
     records:state.records.filter(d=>d.orderId===o.id).length,
     note:String(o.note||''),detailSummary:o.details?[o.details.site,o.details.purpose,o.details.frequency,o.details.method,o.details.productName].filter(Boolean).join(' · '):'세부 조건 미기재',sourceLabel:provenance,relatedRequestStatus:'외부 의사처방 연계 미구현'
   });
  }
  const result=[...groups.values()].sort((a,b)=>b.createdLabel.localeCompare(a.createdLabel,'ko')||a.authorId.localeCompare(b.authorId));
  for(const g of result)g.rows.sort((a,b)=>a.orderId.localeCompare(b.orderId));
  return {patientId,orderCount:all.length,groups:result};
 }
 function buildContext(fixtures,cases,patientId){
  validateCases(fixtures,cases);
  const patient=fixtures.patients.find(p=>p.id===patientId);
  assert(patient,'가상 환자를 찾을 수 없습니다.');
  const c=cases.find(s=>s.patientId===patientId);
  return clone({patientId,title:c.scenarioTitle,admissionContext:patient.reason,history:patient.history,kardex:c.kardex,focus:c.focus,skills:c.skills,reference:c.educationSource});
 }
 return {validateCases,buildContext,buildSheet,dateKey,localTimestamp};
});
