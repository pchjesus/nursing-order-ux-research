"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const D=require('../app/domain.js');
const existing=require('../research/pilot-case-model.cjs');
const Model=require('../research/pilot-viewer-model.js');
const F=existing.loadSyntheticFixtures();
const baseline=existing.buildPilot(F,D);
const original=JSON.stringify(baseline.state),fixtures=JSON.stringify(F);
let passed=0;
const check=(name,fn)=>{fn();passed++;console.log('PASS PILOT VIEW',name)};
check('read-only browser state exactly matches existing CLI pilot source',()=>{
 assert.deepEqual(Model.buildState(F,D),baseline.state);
});
check('synthetic code search uses ACT catalog with three similar candidates',()=>{
 const v=Model.view(F,D,baseline.state,'P-A101','드레싱');
 assert.ok(v.search.some(x=>x.code==='SIM-ACT-0052'));
 assert.ok(v.search.some(x=>x.code==='SIM-ACT-0053'));
 assert.ok(v.search.some(x=>x.code==='SIM-ACT-0054'));
 assert.equal(v.search.every(x=>x.code.startsWith('SIM-ACT-')),true);
});
check('exact code search returns one ACT with correct name',()=>{
 const v=Model.view(F,D,baseline.state,'P-A101','SIM-ACT-0053');
 assert.equal(v.search.length,1);assert.equal(v.search[0].code,Model.ACT_CODE);
 assert.match(v.search[0].name,/멸균 창상 드레싱/);
});
check('independent order IDs and conditional/interval types survive grouping',()=>{
 const v=Model.view(F,D,baseline.state,'P-A101','',true);
 assert.equal(v.groups.length,1);assert.equal(v.groups[0].rows.length,2);
 assert.deepEqual(new Set(v.groups[0].rows.map(r=>r.id)),new Set(['PILOT-O-001','PILOT-O-002']));
 assert.deepEqual(new Set(v.groups[0].rows.map(r=>r.kind)),new Set(['conditional','interval']));
});
check('grouping toggle never mutates underlying order count or source',()=>{
 const g=Model.view(F,D,baseline.state,'P-A101','',true),u=Model.view(F,D,baseline.state,'P-A101','',false);
 assert.equal(g.orders.length,u.orders.length);assert.equal(JSON.stringify(baseline.state),original);
});
check('three planned slots, one simulated execution, zero records are separate',()=>{
 const v=Model.view(F,D,baseline.state,'P-A101');
 assert.equal(v.stats.orders,2);assert.equal(v.stats.plannedSlots,3);
 assert.equal(v.stats.executions,1);assert.equal(v.stats.records,0);
 assert.equal(v.stats.unknownPlans,1);
 const scheduled=v.orders.find(r=>r.id==='PILOT-O-002');
 assert.deepEqual(scheduled.slots.map(s=>s.executions),[1,0,0]);
 assert.equal(scheduled.slots.reduce((n,s)=>n+s.records,0),0);
});
check('conditional count remains null, not zero',()=>{
 const v=Model.view(F,D,baseline.state,'P-A101');
 const conditional=v.orders.find(r=>r.id==='PILOT-O-001');
 assert.equal(conditional.planned,null);assert.equal(conditional.slots.length,0);
});
check('patient B sees only their own order and no execution',()=>{
 const v=Model.view(F,D,baseline.state,'P-B102');
 assert.deepEqual(v.orders.map(r=>r.id),['PILOT-O-003']);assert.equal(v.stats.executions,0);
 assert.equal(v.stats.orders,1);assert.equal(v.stats.plannedSlots,0);assert.equal(v.stats.unknownPlans,1);
});
check('reject unknown patient ID without modifying state',()=>{
 assert.throws(()=>Model.view(F,D,baseline.state,'P-CROSS-UNKNOWN'),/환자/);
 assert.equal(JSON.stringify(baseline.state),original);
});
check('viewer does not create extra fixture cases or mutate source',()=>{
 const m=Model.buildState(F,D);
 assert.equal(m.orders.length,3);assert.equal(JSON.stringify(F),fixtures);
 assert.equal(JSON.stringify(baseline.state),original);
});
check('no personal or clinical identifiers included in separate view',()=>{
 const v=Model.view(F,D,baseline.state,'P-A101');
 assert.equal(v.orders.every(x=>x.id.startsWith('PILOT-O-')),true);
 assert.ok(!JSON.stringify(v).includes('"pin"'));
 assert.ok(!JSON.stringify(v).includes('recording'));
});
check('browser UI is strictly read-only and storage-independent',()=>{
 const src=fs.readFileSync(path.resolve(__dirname,'../research/pilot-viewer-ui.js'),'utf8');
 const html=fs.readFileSync(path.resolve(__dirname,'../research/pilot-viewer.html'),'utf8');
 assert.ok(!/localStorage\s*\./.test(src));
 assert.ok(!/sessionStorage\s*\./.test(src));
 assert.ok(!/fetch\s*\(/.test(src));
 assert.ok(!/\<form\b/i.test(html));
 assert.ok(!html.includes('app/app.js'));
});
console.log('PILOT VIEWER MODEL',passed,'PASSED');