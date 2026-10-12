/* Presentation only: no localStorage, no form submit, no mutations to source fixtures/state. */
(function(){
 'use strict';
 const E=id=>document.getElementById(id);
 const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const D=globalThis.NursingDomain,M=globalThis.NursingPilotViewerModel;
 const fixtures=globalThis.NursingDetailCatalog.expandFixtures(globalThis.DEMO_FIXTURES);
 const state=M.buildState(fixtures,D);
 const sealed=JSON.stringify(state);
 let patientId=M.PATIENT_A;
 const format=value=>new Date(value).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
 const kind={once:'일회성',interval:'주기 반복',conditional:'조건부',unspecified:'예정 미지정'};
 const byCode=new Map(fixtures.catalog.map(x=>[x.code,x]));
 function selectView(){return M.view(fixtures,D,state,patientId,E('pilot-query').value,E('group-by-code').checked);}
 function renderSearch(v){
  E('search-count').textContent=v.search.length+'건';
  E('search-results').innerHTML=v.search.length?v.search.map(x=>`<article class="search-item">
    <span class="category">${safe(x.category)}</span><strong>${safe(x.name)}</strong><code>${safe(x.code)}</code>
   </article>`).join(''):'<p class="empty">일치하는 가상 간호활동이 없습니다.</p>';
 }
 function renderMetrics(v){
  const numbers=[['개별 처방',v.stats.orders,'건'],['예정 슬롯',v.stats.plannedSlots,'개'],['예정 미정 처방',v.stats.unknownPlans,'건'],['모의 수행 사건',v.stats.executions,'건'],['연결 기록',v.stats.records,'건']];
  E('pilot-metrics').innerHTML=numbers.map(([name,value,unit])=>`<div class="metric"><span>${safe(name)}</span><strong>${safe(value)}</strong><small>${safe(unit)}</small></div>`).join('');
  E('patient-context').textContent='선택 환자: '+patientId+' · 자료는 이 환자의 것만 표시';
  for(const button of document.querySelectorAll('[data-pilot-patient]'))button.setAttribute('aria-pressed',String(button.dataset.pilotPatient===patientId));
 }
 function renderOrder(row){
  const details=row.kind==='conditional'?`조건: ${safe(row.condition)}`:
   row.kind==='interval'?`최초 ${format(row.slots[0].at)} · 원래 간격 8시간`:'기존 예정 정보 없음';
  const slots=row.slots.map(s=>`<li><code>${safe(s.id)}</code> <span>${format(s.at)}</span><span class="slot-state">${safe(s.status)}</span><span>모의 수행 ${s.executions}건 / 연결 기록 ${s.records}건</span></li>`).join('');
  return `<article class="order" data-pilot-order="${safe(row.id)}">
   <div class="order-head"><div><span class="tag">${safe(kind[row.kind]||row.kind)}</span><h3>${safe(row.name)}</h3><code>${safe(row.code)}</code></div><span class="identity">${safe(row.id)}</span></div>
   <p class="note">${safe(row.note)}</p><div class="order-summary"><span>예정 <b>${row.planned===null?'미정':row.planned+'개'}</b></span><span>모의 수행 <b>${row.executions}건</b></span><span>간호기록 <b>${row.records}건</b></span></div>
   <p class="hint">${details}</p>
   ${row.slots.length?`<ul class="slots">${slots}</ul>`:'<p class="hint">생성된 예정 슬롯 없음 · 예정 횟수 0회라는 의미가 아닙니다.</p>'}
  </article>`;
 }
 function renderOrders(v){
  E('pilot-orders').innerHTML=v.grouped
   ?v.groups.map(g=>g.rows.length===1?renderOrder(g.rows[0]):`<details class="pilot-group" open><summary><strong>${safe(g.name)}</strong> <code>${safe(g.code)}</code><span>개별 처방 ${g.rows.length}건 · 각 처방 독립 유지</span></summary>${g.rows.map(renderOrder).join('')}</details>`).join('')
   :v.orders.map(renderOrder).join('');
 }
 function render(){
  if(JSON.stringify(state)!==sealed)throw Error('원본 파일럿 상태가 변경되었습니다.');
  const v=selectView();renderSearch(v);renderMetrics(v);renderOrders(v);
 }
 try{
  E('pilot-query').addEventListener('input',render);
  E('clear-search').addEventListener('click',()=>{E('pilot-query').value='';render();});
  E('group-by-code').addEventListener('change',render);
  for(const button of document.querySelectorAll('[data-pilot-patient]'))button.addEventListener('click',()=>{patientId=button.dataset.pilotPatient;render();});
  render();
 }catch(error){
  E('viewer-error').hidden=false;
  E('viewer-error').textContent='합성 평가 화면 표시 오류: '+error.message;
  throw error;
 }
})();
