/* v0.2.7 read-only browser pilot: mirrors research/pilot-case-model.cjs.
 * No localStorage, cookies, network or user-result persistence. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.NursingPilotViewerModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const ACT_CODE='SIM-ACT-0053', PATIENT_A='P-A101', PATIENT_B='P-B102';
 function assert(c,m){if(!c)throw Error('파일럿 사례 오류: '+m);}
 function buildState(F,D){
  const actor=F.users.find(u=>u.shift==='D');
  assert(actor&&F.catalog.some(x=>x.code===ACT_CODE&&x.type==='ACT'),'기본 합성 사례 없음');
  const order=(id,patientId,code,schedule,note,at)=>({
   id,patientId,code,status:'confirmed',orderedBy:actor.id,checkedBy:actor.id,
   createdAt:at,confirmedAt:at,shift:'D',note,...(schedule?{schedule}:{})
  });
  const conditional=D.buildSchedule({kind:'conditional',condition:'가상 조건 발생 시만 평가'},'PILOT-O-001');
  const interval=D.buildSchedule({kind:'interval',startAt:'2026-10-11T01:00:00.000Z',everyHours:8,count:3},'PILOT-O-002');
  const state={schema:2,orders:[
   order('PILOT-O-001',PATIENT_A,ACT_CODE,conditional,'가상 조건부 처방','2026-10-10T01:00:00.000Z'),
   order('PILOT-O-002',PATIENT_A,ACT_CODE,interval,'가상 3개 예정 시점','2026-10-10T02:00:00.000Z'),
   order('PILOT-O-003',PATIENT_B,'SIM-ACT-0052',null,'다른 환자의 별도 가상 처방','2026-10-10T03:00:00.000Z')
  ],executions:[{
   id:'PILOT-E-001',patientId:PATIENT_A,orderId:'PILOT-O-002',
   by:actor.id,at:'2026-10-11T01:10:00.000Z',slotId:'PILOT-O-002-S001',
   note:'모의 수행 사건, 실제 간호행위 아님'
  }],records:[],links:[],audit:[]};
  D.validate(F,state);
  return state;
 }
 function view(F,D,state,patientId,query='',grouped=false){
  assert(F.patients.some(p=>p.id===patientId),'환자 참조 오류');
  D.validate(F,state);
  const matches=D.search(F,query,'');
  const byCode=new Map(F.catalog.map(c=>[c.code,c]));
  const rows=D.forPatient(state,patientId).map(row=>{
   const p=D.scheduleOverview(state,row.order);
   return {id:row.order.id,patientId:row.order.patientId,code:row.order.code,
     name:byCode.get(row.order.code)?.name||row.order.code,note:row.order.note,
     status:row.order.status,detail:row.order.details||null,kind:p.kind,
     condition:p.condition,planned:p.planned,slots:p.slots.map(s=>({
      id:s.id,at:s.at,status:s.status,executions:s.executions.length,records:s.records.length
     })),executions:row.executions.length,records:row.records.length};
  });
  const groups=[];
  for(const row of rows){
   let group=groups.find(g=>g.code===row.code);
   if(!group){group={code:row.code,name:row.name,rows:[]};groups.push(group);}
   group.rows.push(row);
  }
  const stats=D.summary(state,patientId);
  return {
   patientId,query,grouped,
   search:matches.map(x=>({code:x.code,name:x.name,category:x.category})),
   orders:rows,groups,stats,
   caveat:'합성 계획/수행/기록 수치만으로 실제 누락·완료·기록 오류를 판정하지 않습니다.'
  };
 }
 return {buildState,view,ACT_CODE,PATIENT_A,PATIENT_B};
});
