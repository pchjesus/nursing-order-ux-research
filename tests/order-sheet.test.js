const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../app');
const sandbox={globalThis:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'fixtures.js'),'utf8'),sandbox);
const F=JSON.parse(JSON.stringify(sandbox.globalThis.DEMO_FIXTURES));
const C=require('../app/case-context.js'),D=require('../app/domain.js'),M=require('../app/order-sheet-model.js');
const tests=[];const test=(name,fn)=>tests.push([name,fn]);
const S=D.makeSeed(F),original=JSON.stringify(S);

test('case count and unique mapping match four synthetic patients',()=>{assert.equal(C.length,4);assert.equal(M.validateCases(F,C),true);assert.equal(new Set(C.map(x=>x.patientId)).size,4);});
test('all case contexts include source limits and no real patient id',()=>{for(const p of F.patients){const context=M.buildContext(F,C,p.id);assert.equal(context.patientId,p.id);assert.ok(context.kardex.length);assert.ok(context.focus.length);assert.match(context.reference,/자료|사례|워크리스트|실무실습/);assert.ok(!('realPatientId' in context));}});
test('reject duplicate case id',()=>{const duplicate=structuredClone(C);duplicate[1].patientId=duplicate[0].patientId;assert.throws(()=>M.validateCases(F,duplicate),/중복/);});
test('reject missing or extra case',()=>assert.throws(()=>M.validateCases(F,C.slice(1)),/모든 합성 환자/));
test('reject accidental real identity field',()=>{const alt=structuredClone(C);alt[0].realPatientId='123';assert.throws(()=>M.validateCases(F,alt),/실제 식별자/);});
test('no cross-patient order rows',()=>{for(const p of F.patients){const sheet=M.buildSheet(F,S,p.id);const expected=S.orders.filter(o=>o.patientId===p.id);const actual=sheet.groups.flatMap(x=>x.rows);assert.equal(sheet.orderCount,expected.length);assert.deepEqual(new Set(actual.map(x=>x.orderId)),new Set(expected.map(x=>x.id)));assert.ok(actual.every(r=>expected.some(o=>o.id===r.orderId)));}});
test('seed remains unchanged after building contexts and orders',()=>{M.buildContext(F,C,'P-A101');M.buildSheet(F,S,'P-A101');assert.equal(JSON.stringify(S),original);});
test('individual ids stay independent from ACT codes',()=>{const rows=M.buildSheet(F,S,'P-A101').groups.flatMap(x=>x.rows);assert.ok(rows.every(r=>r.orderId!==r.activityCode));assert.ok(rows.every(r=>r.activityCode.startsWith('SIM-ACT-')));assert.ok(rows.every(r=>!r.orderId.startsWith('SIM-ORD-')));});
test('source category denotes seeded or user added, not clinical routine',()=>{const rows=M.buildSheet(F,S,'P-A101').groups.flatMap(x=>x.rows);assert.ok(rows.every(x=>x.sourceLabel==='초기 합성 사례'));const add=D.createDraft(F,S,{userId:'N-D01',shift:'D'},'P-A101','SIM-ACT-0053','모의 신규');const newer=M.buildSheet(F,add.next,'P-A101');assert.ok(newer.groups.flatMap(g=>g.rows).some(r=>r.orderId===add.order.id&&r.sourceLabel==='추가 모의 처방'));});
test('new draft and confirmed event reflect without modifying model structure',()=>{const a=D.createDraft(F,S,{userId:'N-D01',shift:'D'},'P-A101','SIM-ACT-0053','상태 확인');let n=a.next;let row=M.buildSheet(F,n,'P-A101').groups.flatMap(g=>g.rows).find(r=>r.orderId===a.order.id);assert.equal(row.statusLabel,'임시저장');assert.equal(row.checker,'미확인');n=D.confirmDraft(F,n,{userId:'N-D01',shift:'D'},a.order.id,'2468');row=M.buildSheet(F,n,'P-A101').groups.flatMap(g=>g.rows).find(r=>r.orderId===a.order.id);assert.equal(row.statusLabel,'가상 확정');assert.equal(row.checkerId,'N-D01');assert.notEqual(row.confirmedLabel,'—');});
test('execution and documentation counts remain separate',()=>{const a=D.createDraft(F,S,{userId:'N-D01',shift:'D'},'P-A101','SIM-ACT-0053');let n=D.confirmDraft(F,a.next,{userId:'N-D01',shift:'D'},a.order.id,'2468');let e=D.addExecution(F,n,{userId:'N-D01',shift:'D'},a.order.id);n=e.next;let row=M.buildSheet(F,n,'P-A101').groups.flatMap(g=>g.rows).find(x=>x.orderId===a.order.id);assert.equal(row.executions,1);assert.equal(row.records,0);n=D.addRecord(F,n,{userId:'N-D01',shift:'D'},e.execution.id,'가상 간호기록').next;row=M.buildSheet(F,n,'P-A101').groups.flatMap(g=>g.rows).find(x=>x.orderId===a.order.id);assert.equal(row.executions,1);assert.equal(row.records,1);});
test('group order row totals equal source order instances',()=>{for(const p of F.patients){const sheet=M.buildSheet(F,S,p.id);assert.equal(sheet.groups.reduce((acc,g)=>acc+g.rows.length,0),sheet.orderCount);}});
test('unknown patient rejects context and sheet',()=>{assert.throws(()=>M.buildContext(F,C,'P-XYZ'),/가상 환자/);assert.throws(()=>M.buildSheet(F,S,'P-XYZ'),/가상 환자/);});
test('missing order catalog activity rejects unsupported source',()=>{const altered=structuredClone(S);altered.orders.find(o=>o.patientId==='P-A101').code='SIM-MAT-0001';assert.throws(()=>M.buildSheet(F,altered,'P-A101'),/간호활동 참조/);});
test('unknown timestamp displays unverified instead of inventing time',()=>{const altered=structuredClone(S);altered.orders.find(o=>o.patientId==='P-A101').createdAt='not a date';const row=M.buildSheet(F,altered,'P-A101').groups.flatMap(g=>g.rows).find(r=>r.createdLabel==='시각 미확인');assert.ok(row);});
test('does not create PRN or MICU cross-system links',()=>{const row=M.buildSheet(F,S,'P-A101').groups.flatMap(g=>g.rows)[0];assert.equal(row.relatedRequestStatus,'외부 의사처방 연계 미구현');assert.ok(!('prnOrderId' in row));assert.ok(!('micuShiftId' in row));});
test('data returned to view cannot mutate case fixtures',()=>{const before=JSON.stringify(C);const c=M.buildContext(F,C,'P-A101');c.kardex.push('변조');assert.equal(JSON.stringify(C),before);});
let passed=0;for(const [name,fn] of tests){try{fn();console.log('PASS',name);passed++}catch(e){console.error('FAIL',name);throw e;}}
console.log('ORDER SHEET ALL',passed,'passed');
