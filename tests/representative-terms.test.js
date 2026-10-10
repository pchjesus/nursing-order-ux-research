'use strict';
/* Regression: v0.2.4 representative terminology/category management, stable historical data. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'../app'),env={globalThis:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'fixtures.js'),'utf8'),env);
const base=JSON.parse(JSON.stringify(env.globalThis.DEMO_FIXTURES));
const Detail=require('../app/activity-details.js'),D=require('../app/domain.js'),Sheet=require('../app/order-sheet-model.js');
const F=Detail.expandFixtures(base),session={userId:'N-D01',shift:'D'};
let n=0;function test(label,run){run();n++;console.log('PASS',label)}
test('all 18 legacy IDs preserved with unique representative metadata and valid material category',()=>{
 assert.equal(F.products.length,18);assert.deepEqual(F.products.map(p=>p.id),Detail.PRODUCTS.map(p=>p.id));
 assert.equal(new Set(F.products.map(p=>p.id)).size,18);
 for(const p of F.products){assert.ok(p.displayName&&p.variant&&p.categoryId);assert.ok(Detail.MATERIAL_CATEGORIES.some(c=>c.id===p.categoryId));assert.ok(Array.isArray(p.aliases));}
});
test('readable representative terms appear; original references remain',()=>{
 assert.equal(F.products.find(p=>p.id==='SIM-PRD-001').displayName,'듀오덤');
 assert.equal(F.products.find(p=>p.id==='SIM-PRD-002').displayName,'듀오덤');
 assert.equal(F.products.find(p=>p.id==='SIM-PRD-003').displayName,'비지블 드레싱');
 assert.equal(F.products.find(p=>p.id==='SIM-GEN-002').displayName,'도지 플로우');
 assert.equal(F.products.find(p=>p.id==='SIM-PRD-001').name,'듀오덤 DuoDERM Extra Thin');
 assert.equal(F.products.find(p=>p.id==='SIM-PRD-003').name,'Tegaderm 투명 필름 드레싱');
});
test('representative labels keep necessary distinctions, not exact model strings',()=>{
 const duos=F.products.filter(p=>p.displayName==='듀오덤');assert.equal(duos.length,2);assert.notEqual(Detail.displayLabel(duos[0]),Detail.displayLabel(duos[1]));
 const pump=F.products.filter(p=>p.categoryId==='infusion-pump');assert.equal(pump.length,2);assert.notEqual(Detail.displayLabel(pump[0]),Detail.displayLabel(pump[1]));
 assert.ok(pump.every(p=>!Detail.displayLabel(p).includes('PVC')));
});
test('category choices appear only when permitted for a nursing activity',()=>{
 const dress=Detail.productChoices(F,'SIM-ACT-0053');const categories=Detail.categoriesFor(dress);
 assert.ok(categories.some(c=>c.id==='dressing-hydro'));assert.ok(categories.some(c=>c.id==='dressing-film'));assert.ok(!categories.some(c=>c.id==='infusion-pump'));
 assert.deepEqual(Detail.categoriesFor(Detail.productChoices(F,'SIM-ACT-0042')).map(c=>c.id),['infusion-pump']);
 assert.equal(Detail.productChoices(F,'SIM-ACT-0049').length,0);
});
test('product keyword searches use representative AND legacy terms, no unrelated line dressing match',()=>{
 const visible=D.search(F,'비지블 드레싱','');assert.ok(visible.some(x=>x.code==='SIM-ACT-0043'));
 assert.ok(D.search(F,'Tegaderm','').some(x=>x.code==='SIM-ACT-0043'));
 assert.ok(D.search(F,'도지 플로우','').some(x=>x.code==='SIM-ACT-0041'));
 assert.ok(!D.search(F,'듀오덤','').some(x=>x.code==='SIM-ACT-0043'));
});
test('new orders save readable representative snapshot with original product ID',()=>{
 const seed=D.makeSeed(F);
 const detail={site:'수술부위',purpose:'창상 보호',frequency:'일 1회',method:'멸균 드레싱 관련 관리',productId:'SIM-PRD-001'};
 const {next,order}=D.createDraft(F,seed,session,'P-A101','SIM-ACT-0053','',detail);
 assert.equal(order.details.productName,'듀오덤 · 얇은형');assert.equal(order.details.productId,'SIM-PRD-001');
 D.validate(F,next);assert.equal(next.schema,2);assert.equal(D.STORAGE_KEY,'nursing-order-demo-v02');
 const row=Sheet.buildSheet(F,next,'P-A101').groups.flatMap(g=>g.rows).find(r=>r.orderId===order.id);
 assert.ok(row.detailSummary.includes('듀오덤 · 얇은형'));assert.equal(row.activityCode,'SIM-ACT-0053');
});
test('v0.2.3 snapshot stays untouched while displayed through representative term',()=>{
 const seed=D.makeSeed(F);
 seed.orders[0].details={site:'수술부위',purpose:'창상 보호',frequency:'일 1회',method:'멸균 드레싱 관련 관리',productId:'SIM-PRD-001',productName:'듀오덤 DuoDERM Extra Thin',productKind:'하이드로콜로이드 드레싱'};
 const before=JSON.stringify(seed);D.validate(F,seed);
 assert.equal(Detail.displaySavedProduct(F,seed.orders[0].details),'듀오덤 · 얇은형');
 const record=Sheet.buildSheet(F,seed,'P-A101').groups.flatMap(g=>g.rows).find(r=>r.orderId===seed.orders[0].id);
 assert.ok(record.detailSummary.includes('듀오덤 · 얇은형'));assert.equal(JSON.stringify(seed),before);
});
test('old or unknown product ID is never silently changed or erased',()=>{
 const old={productId:'SIM-NO-LONGER-SHOWN',productName:'기존 확인 전 상품명'};
 assert.equal(Detail.displaySavedProduct(F,old),'기존 확인 전 상품명');
});
test('flow regulator and pump products remain separate as before',()=>{
 const flow={site:'수액 주입라인',purpose:'주입속도 확인',frequency:'매 근무조',method:'도지플로우(유량조절기형)',productId:'SIM-GEN-002'};
 const state=D.makeSeed(F), before=JSON.stringify(state),draft=D.createDraft(F,state,session,'P-A101','SIM-ACT-0041','',flow);
 assert.equal(draft.order.details.productName,'도지 플로우 · 유량조절기형');
 assert.throws(()=>D.createDraft(F,state,session,'P-A101','SIM-ACT-0041','',{...flow,productId:'SIM-PRD-006'}),/일치하지/);
 assert.equal(JSON.stringify(state),before);
});
console.log(`REPRESENTATIVE TERM TESTS ${n} PASSED`);
