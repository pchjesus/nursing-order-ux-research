const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const sandbox = {globalThis: {}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app/fixtures.js'),'utf8'), sandbox);
const F = JSON.parse(JSON.stringify(sandbox.globalThis.DEMO_FIXTURES));
const D = require('../app/domain.js');
const session = {userId:'N-D01',shift:'D'};
let count=0;
function test(label,fn){fn();console.log('PASS',label);count++;}
let s=D.makeSeed(F);
const orig=JSON.stringify(s);
const patient='P-A101';
const repeated='SIM-ACT-0053';
test('default seeded groups retain every original instance',()=>{
 const groups=D.groupPatientOrders(F,s,patient);
 assert.equal(groups.reduce((n,g)=>n+g.items.length,0),D.forPatient(s,patient).length);
 assert.ok(groups.every(g=>g.items.every(r=>r.order.patientId===patient && r.order.code===g.code)));
 assert.equal(JSON.stringify(s),orig);
});
const o1=D.createDraft(F,s,session,patient,repeated,'첫 번째 가상 조건');s=o1.next;
const o2=D.createDraft(F,s,session,patient,repeated,'두 번째 별도 가상 조건');s=o2.next;
const id1=o1.order.id,id2=o2.order.id;
test('same patient and code groups distinct orders without merging notes',()=>{
 const g=D.groupPatientOrders(F,s,patient).find(g=>g.code===repeated);
 assert.equal(g.items.length,3); // one fixture + two newly drafted
 assert.equal(new Set(g.items.map(x=>x.order.id)).size,3);
 assert.ok(g.items.some(x=>x.order.id===id1 && x.order.note==='첫 번째 가상 조건'));
 assert.ok(g.items.some(x=>x.order.id===id2 && x.order.note==='두 번째 별도 가상 조건'));
 assert.equal(g.statusCounts.draft,2);
});
test('grouping is pure and uses unique record counts',()=>{
 const before=JSON.stringify(s);
 const groups=D.groupPatientOrders(F,s,patient);
 assert.equal(groups.reduce((n,g)=>n+g.executions,0),D.summary(s,patient).executions);
 assert.equal(groups.reduce((n,g)=>n+g.records,0),D.summary(s,patient).records);
 assert.equal(JSON.stringify(s),before);
});
test('status filter restricts visible rows rather than mutating source',()=>{
 const g=D.groupPatientOrders(F,s,patient,{status:'draft'});
 assert.equal(g.length,1);assert.equal(g[0].items.length,2);
 assert.equal(g[0].executions,0);assert.equal(g[0].records,0);
 assert.equal(s.orders.filter(x=>x.id===id1||x.id===id2).length,2);
});
test('search filter and no-result state',()=>{
 const arr=D.groupPatientOrders(F,s,patient,{query:'멸균'});
 assert.equal(arr.length,1);assert.equal(arr[0].code,repeated);
 assert.deepEqual(D.groupPatientOrders(F,s,patient,{query:'없는-항목'}),[]);
});
test('other patient is isolated even when code repeats',()=>{
 const other=D.createDraft(F,s,session,'P-B102',repeated,'다른 환자');s=other.next;
 const pa=D.groupPatientOrders(F,s,patient).find(g=>g.code===repeated);
 const pb=D.groupPatientOrders(F,s,'P-B102').find(g=>g.code===repeated);
 assert.equal(pa.items.length,3);assert.equal(pb.items.length,1);
 assert.ok(!pa.items.some(x=>x.order.id===other.order.id));
 assert.ok(pb.items.every(x=>x.order.patientId==='P-B102'));
});
test('confirmation does not remove individual identities',()=>{
 const before=D.groupPatientOrders(F,s,patient).find(g=>g.code===repeated);
 s=D.confirmDraft(F,s,session,id1,'2468');
 const after=D.groupPatientOrders(F,s,patient).find(g=>g.code===repeated);
 assert.deepEqual(new Set(after.items.map(x=>x.order.id)),new Set(before.items.map(x=>x.order.id)));
 assert.equal(after.statusCounts.confirmed,(before.statusCounts.confirmed||0)+1);
 assert.equal(after.statusCounts.draft,(before.statusCounts.draft||0)-1);
});
test('invalid patient rejected',()=>assert.throws(()=>D.groupPatientOrders(F,s,'BAD'),/가상 환자/));
D.validate(F,s);
console.log('GROUPING ALL',count,'passed');
