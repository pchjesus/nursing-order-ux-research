const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root={globalThis:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app/fixtures.js'),'utf8'),root);
const Detail=require('../app/activity-details.js'),D=require('../app/domain.js'),Sheet=require('../app/order-sheet-model.js');
const F=Detail.expandFixtures(JSON.parse(JSON.stringify(root.globalThis.DEMO_FIXTURES)));
const session={userId:'N-D01',shift:'D'};
const startAt='2026-10-11T01:00:00.000Z';
let count=0;function test(name,fn){fn();count++;console.log('PASS',name);}
const seeded=D.makeSeed(F),original=JSON.stringify(seeded);
test('legacy seeded orders and schema 2 remain untouched',()=>{
 assert.equal(seeded.schema,2);assert.equal(seeded.orders.length,16);assert.equal(F.catalog.length,42);
 assert.ok(seeded.orders.every(o=>!Object.hasOwn(o,'schedule')));D.validate(F,seeded);
 assert.equal(D.STORAGE_KEY,'nursing-order-demo-v02');
});
test('legacy state produces unknown plans, never inferred missing executions',()=>{
 const sum=D.summary(seeded,'P-A101');assert.equal(sum.plannedSlots,0);
 assert.equal(sum.unknownPlans,sum.orders);assert.equal(D.scheduleOverview(seeded,seeded.orders[0]).planned,null);
});
test('one-time planned slot has stable order-scoped identifier',()=>{
 const out=D.createDraft(F,seeded,session,'P-A101','SIM-ACT-0001','',null,{kind:'once',startAt});
 assert.equal(out.order.schedule.slots.length,1);assert.equal(out.order.schedule.slots[0].id,out.order.id+'-S001');
 assert.equal(out.order.schedule.slots[0].at,startAt);D.validate(F,out.next);
});
test('interval generates exactly three independent planned slots',()=>{
 const p=D.buildSchedule({kind:'interval',startAt,count:3,everyHours:8},'O-SAMPLE');
 assert.deepEqual(p.slots.map(x=>x.at),[startAt,'2026-10-11T09:00:00.000Z','2026-10-11T17:00:00.000Z']);
 assert.equal(D.validateSchedule(p,'O-SAMPLE'),true);
});
test('conditional schedule has unknown count, not zero expected performances',()=>{
 const out=D.createDraft(F,seeded,session,'P-B102','SIM-ACT-0001','',null,{kind:'conditional',condition:'환자 증상 변화 시'});
 assert.equal(D.scheduleOverview(out.next,out.order).planned,null);
 assert.equal(out.order.schedule.slots.length,0);assert.ok(out.order.schedule.condition.includes('변화'));
});
test('absence of schedule remains valid and does not imply one-time execution',()=>{
 const out=D.createDraft(F,seeded,session,'P-A101','SIM-ACT-0001');
 assert.equal(out.order.schedule,undefined);assert.equal(D.scheduleOverview(out.next,out.order).planned,null);
});
test('reject invalid interval or malformed timestamp',()=>{
 for(const spec of [
  {kind:'interval',startAt,count:25,everyHours:8},
  {kind:'interval',startAt,count:1,everyHours:8},
  {kind:'interval',startAt,count:3,everyHours:0},
  {kind:'once',startAt:'2026-02-30T10:00:00.000Z'},
  {kind:'once',startAt:'2026-10-11T10:00'},
  {kind:'conditional',condition:' '},
  {kind:'invalid',startAt}
 ])assert.throws(()=>D.createDraft(F,seeded,session,'P-A101','SIM-ACT-0001','',null,spec));
 assert.equal(JSON.stringify(seeded),original);
});
const draft=D.createDraft(F,seeded,session,'P-A101','SIM-ACT-0001','test',null,{kind:'interval',startAt,count:3,everyHours:8});
const orderId=draft.order.id,slotId=draft.order.schedule.slots[0].id;
let state=D.confirmDraft(F,draft.next,session,orderId,'2468');
test('new planned count and existing four independent entity counts remain distinct',()=>{
 const sum=D.summary(state,'P-A101');
 assert.equal(sum.plannedSlots,3);assert.equal(sum.executions,D.summary(seeded,'P-A101').executions);
 assert.equal(sum.records,D.summary(seeded,'P-A101').records);
 assert.equal(sum.orders,D.summary(seeded,'P-A101').orders+1);
});
test('reject slot belonging to another order or patient',()=>{
 const originalState=JSON.stringify(state);
 const other=D.createDraft(F,state,session,'P-B102','SIM-ACT-0001','',null,{kind:'once',startAt});
 assert.throws(()=>D.addExecution(F,state,session,orderId,'',other.order.schedule.slots[0].id),/속하지 않는/);
 assert.equal(JSON.stringify(state),originalState);
});
test('one execution explicitly links to a planned slot without filling others',()=>{
 const out=D.addExecution(F,state,session,orderId,'관련 수행',slotId);state=out.next;
 assert.equal(out.execution.slotId,slotId);
 const v=D.scheduleOverview(state,state.orders.find(o=>o.id===orderId));
 assert.deepEqual(v.slots.map(x=>x.executions.length),[1,0,0]);
 assert.equal(v.planned,3);assert.equal(v.unassigned,0);
});
test('linked nursing record stays a separate event',()=>{
 const event=state.executions.find(e=>e.slotId===slotId);
 state=D.addRecord(F,state,session,event.id,'합성 평가 기록').next;
 const v=D.scheduleOverview(state,state.orders.find(o=>o.id===orderId));
 assert.equal(v.slots[0].executions.length,1);assert.equal(v.slots[0].records.length,1);
 assert.equal(v.slots[1].records.length,0);
});
test('generic legacy execution remains unassigned, not auto-matched by time',()=>{
 state=D.addExecution(F,state,session,orderId,'일반 수행').next;
 const v=D.scheduleOverview(state,state.orders.find(o=>o.id===orderId));
 assert.equal(v.unassigned,1);assert.deepEqual(v.slots.map(s=>s.executions.length),[1,0,0]);
});
test('record and execution times, authors and distinct IDs survive round-trip',()=>{
 const raw=JSON.stringify(state),saved=JSON.parse(raw);
 D.validate(F,saved);assert.equal(JSON.stringify(saved),raw);
 assert.equal(new Set(saved.executions.map(x=>x.id)).size,saved.executions.length);
 assert.ok(saved.executions.some(x=>x.slotId===slotId&&x.by==='N-D01'));
 assert.ok(saved.links.some(l=>saved.executions.some(e=>e.id===l.executionId)));
});
test('tampered schedule or cross-order slot linkage is rejected on restore',()=>{
 for(const corrupt of [
  s=>s.orders.find(o=>o.id===orderId).schedule.slots[0].status='invalid',
  s=>s.orders.find(o=>o.id===orderId).schedule.slots[1].id=slotId,
  s=>s.orders.find(o=>o.id===orderId).schedule.slots[2].at=startAt,
  s=>s.executions.find(e=>e.slotId===slotId).slotId='P-B102-S001',
 ]){const data=structuredClone(state);corrupt(data);assert.throws(()=>D.validate(F,data));}
 D.validate(F,state);
});
test('explicit held/cancelled slot can be displayed but not newly executed',()=>{
 const custom=structuredClone(state),order=custom.orders.find(o=>o.id===orderId);
 order.schedule.slots[1].status='held';order.schedule.slots[2].status='cancelled';
 D.validate(F,custom);assert.throws(()=>D.addExecution(F,custom,session,orderId,'',order.schedule.slots[1].id),/보류/);
});
test('Kardex and grouping show plan without merging code or order IDs',()=>{
 const rows=Sheet.buildSheet(F,state,'P-A101').groups.flatMap(x=>x.rows);
 assert.equal(rows.find(x=>x.orderId===orderId).scheduleLabel,'예정 3회');
 assert.ok(rows.some(x=>x.scheduleLabel==='예정 미지정'));
 const groups=D.groupPatientOrders(F,state,'P-A101');
 assert.ok(groups.flatMap(g=>g.items).some(x=>x.order.id===orderId));
 assert.equal(groups.flatMap(g=>g.items).length,D.forPatient(state,'P-A101').length);
});
test('patient data and schedules remain isolated',()=>{
 const a=D.summary(state,'P-A101'),b=D.summary(state,'P-B102');
 assert.equal(a.plannedSlots,3);assert.equal(b.plannedSlots,0);
 assert.ok(D.forPatient(state,'P-B102').every(x=>x.order.patientId==='P-B102'));
});
test('no original fixtures or seeded history mutated',()=>{
 assert.equal(JSON.stringify(seeded),original);assert.ok(state.audit.some(x=>x.orderId===orderId&&x.action==='reauth_confirmed'));
});
console.log('SCHEDULING TESTS',count,'PASSED');
