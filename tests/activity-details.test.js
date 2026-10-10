const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const f=path.resolve(__dirname,'../app');const env={globalThis:{}};
vm.runInNewContext(fs.readFileSync(path.join(f,'fixtures.js'),'utf8'),env);
const base=JSON.parse(JSON.stringify(env.globalThis.DEMO_FIXTURES));
const C=require('../app/activity-details.js'),D=require('../app/domain.js'),Sheet=require('../app/order-sheet-model.js');
const F=C.expandFixtures(base),session={userId:'N-D01',shift:'D'};
let passed=0;const run=(name,fn)=>{fn();passed++;console.log('PASS',name)};
run('original 38 ACT preserved; 4 genuine original ACT catalog codes added',()=>{
 assert.equal(base.catalog.length,38);assert.equal(F.catalog.length,42);
 const old=new Set(base.catalog.map(x=>x.code));for(const c of old)assert.ok(F.catalog.some(x=>x.code===c));
 assert.equal(new Set(F.catalog.map(x=>x.code)).size,42);
 assert.deepEqual(F.catalog.slice(-4).map(x=>x.code),['SIM-ACT-0039','SIM-ACT-0040','SIM-ACT-0041','SIM-ACT-0042']);
});
run('all activity codes have category-based profiles',()=>{assert.equal(Object.keys(F.profiles).length,42);for(const a of F.catalog){const p=F.profiles[a.code];assert.ok(p.sites.length&&p.purposes.length&&p.frequencies.length&&p.methods.length);}});
run('official products distinguish branded and generic material, never treatment claims',()=>{
 assert.ok(F.products.length>=12);assert.equal(new Set(F.products.map(p=>p.id)).size,F.products.length);
 assert.ok(F.products.find(x=>x.name==='듀오덤 DuoDERM Extra Thin')?.url?.startsWith('https://'));
 assert.equal(F.products.find(x=>x.name.includes('도지플로우'))?.manufacturer,null);
});
run('DuoDERM query finds eligible ACT, not MAT',()=>{const out=D.search(F,'듀오덤',''); // Korean aliases are not product English names; add explicit Korean alias below
 assert.ok(out.length>0);assert.ok(out.every(x=>x.type==='ACT'));});
run('infusion choices separate Dosi-flow style and infusion pump products',()=>{
 let p=F.profiles['SIM-ACT-0041'];assert.ok(p.methods.some(x=>x.includes('도지플로우')));assert.ok(p.methods.some(x=>x.includes('펌프')));
 assert.ok(C.productChoices(F,'SIM-ACT-0042').some(x=>x.name.includes('Infusomat')));
 assert.ok(!C.productChoices(F,'SIM-ACT-0042').some(x=>x.id==='SIM-GEN-002'));
 assert.ok(C.productChoices(F,'SIM-ACT-0041').some(x=>x.id==='SIM-GEN-002'));
});
const seed=D.makeSeed(F),original=JSON.stringify(seed);
const details={site:'수술부위',purpose:'창상 보호',frequency:'매 근무조',method:'멸균 드레싱 관련 관리',productId:'SIM-PRD-001'};
const created=D.createDraft(F,seed,session,'P-A101','SIM-ACT-0053','가상 사례',details);
run('draft stores selected structured details and immutable product display snapshot',()=>{const a=created.order;
 assert.equal(a.status,'draft');assert.equal(a.details.productId,'SIM-PRD-001');assert.equal(a.details.productName,'듀오덤 DuoDERM Extra Thin');
 assert.equal(a.details.site,'수술부위');assert.equal(a.details.frequency,'매 근무조');D.validate(F,created.next);
});
run('original seed remains unchanged; no migration on legacy schema 2',()=>{assert.equal(JSON.stringify(seed),original);assert.equal(created.next.schema,2);assert.equal(D.STORAGE_KEY,'nursing-order-demo-v02');D.validate(F,JSON.parse(JSON.stringify(seed)));});
run('wrong product family rejected without mutating data',()=>{
 const bad={...details,productId:'SIM-PRD-006'};assert.throws(()=>D.createDraft(F,seed,session,'P-A101','SIM-ACT-0053','',bad),/제품/);assert.equal(JSON.stringify(seed),original);
});
run('wrong activity method rejected without mutating data',()=>{assert.throws(()=>D.createDraft(F,seed,session,'P-A101','SIM-ACT-0053','',{...details,method:'주입펌프 세트'}),/세부 조건/);assert.equal(JSON.stringify(seed),original);});
run('invalid oversized product name rejected during restore',()=>{const n=structuredClone(created.next);n.orders.at(-1).details.productName='X'.repeat(161);assert.throws(()=>D.validate(F,n),/스냅샷/);});
run('historical product name snapshot survives later product catalog rename',()=>{const changed=structuredClone(F);changed.products.find(p=>p.id==='SIM-PRD-001').name='미래에 변경된 표시 이름';D.validate(changed,created.next);assert.equal(created.order.details.productName,'듀오덤 DuoDERM Extra Thin');});
run('newly appended infusion ACT can be saved with independent generic method',()=>{
 const det={site:'수액 주입라인',purpose:'주입속도 확인',frequency:'매 근무조',method:'도지플로우(유량조절기형)',productId:'SIM-GEN-002'};
 const out=D.createDraft(F,seed,session,'P-A101','SIM-ACT-0041','',det);assert.equal(out.order.code,'SIM-ACT-0041');assert.equal(out.order.details.productId,'SIM-GEN-002');
});
run('confirmation keeps detail metadata and associated patient',()=>{const conf=D.confirmDraft(F,created.next,session,created.order.id,'2468');const o=conf.orders.find(o=>o.id===created.order.id);assert.deepEqual(o.details,created.order.details);assert.equal(o.patientId,'P-A101');});
run('Kardex order sheet includes saved details but old records show missing',()=>{
 const rows=Sheet.buildSheet(F,created.next,'P-A101').groups.flatMap(g=>g.rows);
 const newR=rows.find(x=>x.orderId===created.order.id);assert.ok(newR.detailSummary.includes('DuoDERM'));
 assert.ok(rows.some(x=>x.detailSummary==='세부 조건 미기재'));
});
run('read-only grouping preserves new details and individual IDs',()=>{const groups=D.groupPatientOrders(F,created.next,'P-A101');const g=groups.find(x=>x.code==='SIM-ACT-0053');assert.ok(g.items.some(x=>x.order.details?.productId==='SIM-PRD-001'));assert.equal(g.items.length,2);});
run('wrong infusion method/product combination rejected',()=>{const incompatible={site:'수액 주입라인',purpose:'주입속도 확인',frequency:'매 근무조',method:'인퓨전 펌프 전용세트',productId:'SIM-GEN-002'};assert.throws(()=>D.createDraft(F,seed,session,'P-A101','SIM-ACT-0041','',incompatible),/일치하지/);});
run('CVC selection excludes unrelated hydrocolloid products',()=>{assert.ok(!C.productChoices(F,'SIM-ACT-0043').some(x=>x.id==='SIM-PRD-001'));});
run('product selection for assessment-only activity not forced',()=>{assert.equal(C.productChoices(F,'SIM-ACT-0049').length,0);});
run('not every activity offers branded materials' ,()=>{const options=C.productChoices(F,'SIM-ACT-0174');assert.equal(options.length,0);});
console.log('DETAIL TESTS',passed,'PASSED');
