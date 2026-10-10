/* Replaceable UI adapter. All mutations go through NursingDomain. */
(function(){'use strict';
const Detail=globalThis.NursingDetailCatalog,F=Detail.expandFixtures(globalThis.DEMO_FIXTURES),D=globalThis.NursingDomain;
const C=globalThis.DEMO_CASE_CONTEXTS,Sheet=globalThis.NursingOrderSheet;
const el=id=>document.getElementById(id);
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=value=>value?new Date(value).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'—';
const label=id=>F.users.find(x=>x.id===id)?.name||id||'미확인';
const status={draft:'임시저장',confirmed:'확정',held:'보류',cancelled:'취소'};
let state,session=null,patientId=F.patients[0].id,selectedCode=null,tab='search',confirmId=null,lastFormCode=null;
function notice(text,error=false){el('flash').textContent=text;el('flash').className=error?'flash error':'flash';}
function load(){try{const raw=localStorage.getItem(D.STORAGE_KEY);if(raw){state=D.validate(F,JSON.parse(raw));return;}state=D.makeSeed(F);D.validate(F,state);persist();}catch(e){state=null;notice('저장 데이터 문제가 있어 자동 초기화하지 않았습니다: '+e.message,true);}}
function persist(){D.validate(F,state);localStorage.setItem(D.STORAGE_KEY,JSON.stringify(state));}
function withChange(result,message){const next=result.next||result;D.validate(F,next);localStorage.setItem(D.STORAGE_KEY,JSON.stringify(next));state=next;notice(message);render();}
function guarded(fn){try{if(!state)throw Error('먼저 테스트 데이터를 초기화해야 합니다.');fn();}catch(e){notice(e.message,true);}}
function logged(){if(!session)throw Error('먼저 모의 계정으로 로그인해 주세요.');if(!D.shiftAllowed(F,session.userId,session.shift))throw Error('현재 모의 근무조에 로그인한 계정이 아닙니다.');}
function renderAccountOptions(){const shift=el('shift').value;el('account').innerHTML=F.users.filter(x=>x.shift===shift).map(x=>`<option value="${x.id}">${escapeHTML(x.name)} · ${x.id}</option>`).join('');el('password').value='';el('account-help').textContent='데모 비밀번호: '+F.users.filter(x=>x.shift===shift).map(x=>`${x.id} = ${x.pin}`).join(' / ');}
function renderLogin(){const u=F.users.find(x=>x.id===session?.userId);el('session-label').textContent=u?`${u.name} · ${session.shift} 근무조`:'로그인 전';el('login-state').textContent=u?'이 계정이 현재 모의 입력·확인자로 기록됩니다.':'선택된 모의 근무조의 계정으로 로그인';el('logout').disabled=!u;}
function renderPatients(){el('patient-list').innerHTML=F.patients.map(p=>`<button class="patient-btn ${p.id===patientId?'active':''}" data-patient="${p.id}"><strong>${p.name}</strong><small>${p.ward} · ${p.bed}</small></button>`).join('');const p=F.patients.find(x=>x.id===patientId);el('patient-name').textContent=p.name;el('patient-meta').textContent=`${p.id} · ${p.sex}/${p.age}세 · ${p.ward} ${p.bed} · ${p.reason}`;el('patient-history').textContent=p.history;el('patient-summary').textContent=p.summary;el('patient-tags').innerHTML=p.tags.map(x=>`<span class="chip">${escapeHTML(x)}</span>`).join('');}
function renderCaseSheet(){
 const c=Sheet.buildContext(F,C,patientId);
 const summary=el('case-summary');
 summary.innerHTML=`<p class="case-title">${escapeHTML(c.title)}</p><p class="meta">${escapeHTML(c.patientId)} · ${escapeHTML(c.admissionContext)}</p><p class="case-subhead">가상 인계 사항</p><ul>${c.kardex.map(t=>`<li>${escapeHTML(t)}</li>`).join('')}</ul><p class="case-subhead">관찰 초점</p><div class="case-tags">${c.focus.map(t=>`<span class="chip">${escapeHTML(t)}</span>`).join('')}</div><p class="case-subhead">워크리스트 관련 술기</p><p>${escapeHTML(c.skills.join(' · '))}</p><p class="help">자료 형식 참고: ${escapeHTML(c.reference)}</p>`;
 const sheet=Sheet.buildSheet(F,state,patientId);
 const rows=sheet.groups.map(g=>`<section class="sheet-group"><div class="sheet-group-heading"><strong>${escapeHTML(g.provenance)} · ${escapeHTML(g.createdLabel)}</strong><span>작성자(모의): ${escapeHTML(g.author)} · ${g.rows.length}건</span></div><div class="sheet-scroll"><table class="sheet-table"><thead><tr><th scope="col">구분</th><th scope="col">간호활동 코드</th><th scope="col">간호활동명</th><th scope="col">개별 처방 ID</th><th scope="col">상태</th><th scope="col">수행/기록</th><th scope="col">작성자</th><th scope="col">확인자</th><th scope="col">작성 시각</th></tr></thead><tbody>${g.rows.map(r=>`<tr><td>${escapeHTML(r.sourceLabel)}</td><td class="code">${escapeHTML(r.activityCode)}</td><td>${escapeHTML(r.activityName)}<small class="sheet-category">${escapeHTML(r.category)}</small><small class="sheet-category">${escapeHTML(r.detailSummary||'세부 조건 미기재')}</small><small class="sheet-category">${escapeHTML(r.scheduleLabel||'예정 미지정')}</small></td><td class="code">${escapeHTML(r.orderId)}</td><td>${escapeHTML(r.statusLabel)}</td><td>수행 ${r.executions} / 기록 ${r.records}</td><td>${escapeHTML(r.author)}</td><td>${escapeHTML(r.checker)}<small class="sheet-category">${escapeHTML(r.confirmedLabel)}</small></td><td>${escapeHTML(r.createdLabel)}</td></tr>`).join('')}</tbody></table></div></section>`).join('');
 el('case-order-sheet').innerHTML=sheet.orderCount?`<p class="help">선택 환자의 개별 간호처방 ${sheet.orderCount}건 · 환자별 분리 · 화면 조회 전용 · 용량/경로 등 해당하지 않는 필드는 생성하지 않음</p>${rows}`:'<div class="empty">이 환자에게 생성된 가상 간호처방이 없습니다.</div>';
}
function renderTabs(){el('page-search').hidden=tab!=='search';el('page-status').hidden=tab!=='status';for(const id of ['search','status']){el('tab-'+id).classList.toggle('selected',id===tab);el('tab-'+id).setAttribute('aria-pressed',String(id===tab));}}
function renderDetailForm(){
 const code=selectedCode,p=F.profiles?.[code];if(!p)return;
 if(code===lastFormCode)return;
 lastFormCode=code;
 for(const [id,items] of [['detail-site',p.sites],['detail-purpose',p.purposes],['detail-frequency',p.frequencies],['detail-method',p.methods]]){
  el(id).innerHTML='<option value="">미지정 · 선택하지 않음</option>'+items.map(x=>`<option value="${escapeHTML(x)}">${escapeHTML(x==='도지플로우(유량조절기형)'?'도지 플로우(유량조절기형)':x)}</option>`).join('');
 }
 refreshProductChoices(false);
}
/* UI categories are presentation filters, not an order field or a new stored product ID. */
function refreshProductChoices(preserve=true){
 const priorProduct=preserve?el('detail-product').value:'';
 const priorCategory=preserve?el('detail-product-category').value:'';
 const available=Detail.productChoices(F,selectedCode,el('detail-method').value);
 const categories=Detail.categoriesFor(available);
 const category=categories.some(c=>c.id===priorCategory)?priorCategory:'';
 el('detail-product-category').innerHTML='<option value="">전체 관련 카테고리</option>'+categories.map(c=>`<option value="${escapeHTML(c.id)}">${escapeHTML(c.label)}</option>`).join('');
 el('detail-product-category').value=category;
 const groups=categories.filter(c=>!category||c.id===category).map(c=>{
  const products=available.filter(p=>p.categoryId===c.id);
  return `<optgroup label="${escapeHTML(c.label)}">${products.map(p=>`<option value="${escapeHTML(p.id)}">${escapeHTML(Detail.displayLabel(p))}</option>`).join('')}</optgroup>`;
 });
 el('detail-product').innerHTML='<option value="">제품 선택 안 함</option>'+groups.join('');
 if(available.some(p=>p.id===priorProduct&&(!category||p.categoryId===category)))el('detail-product').value=priorProduct;
 updateProductHelp();
}
function updateProductHelp(){const product=F.products.find(x=>x.id===el('detail-product').value);const info=el('detail-product-info');if(!product){
 info.textContent='대표 용어로 묶은 교육용 참고 목록입니다. 제품 선택은 필수가 아니며 실제 호환성·병원 사용 여부·임상 적합성을 의미하지 않습니다.';
 return;
 }
 const category=Detail.MATERIAL_CATEGORIES.find(x=>x.id===product.categoryId)?.label||'기타';
 info.textContent=`${category} · ${product.kind} · 대표 용어(정확한 제품 모델명 아님). 선택 기록에는 원본 제품 ID를 유지합니다. 장비 호환성·실제 적용은 별도 확인 필요. `;
 if(product.url){const link=document.createElement('a');link.href=product.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='참고 제조사 자료';info.appendChild(link);}
}
function selectedDetails(){return {site:el('detail-site').value,purpose:el('detail-purpose').value,frequency:el('detail-frequency').value,method:el('detail-method').value,productId:el('detail-product').value};}
function detailHTML(details){if(!details)return '<span class="detail-legacy">과거 생성 처방 · 세부 조건 미기재</span>';
 const fields=[['부위',details.site],['목적',details.purpose],['빈도',details.frequency],['방법',details.method],['제품/기구',Detail.displaySavedProduct(F,details)]];
 return `<span class="order-details">${fields.filter(([,v])=>v).map(([k,v])=>`<span class="detail-pill"><b>${k}</b> ${escapeHTML(v)}</span>`).join('')||'<span class="detail-legacy">모든 세부 조건 미지정</span>'}</span>`;
}
function renderCatalog(){const results=D.search(F,el('query').value,el('category').value);el('result-count').textContent=results.length+'건';el('catalog-list').innerHTML=results.length?results.map(x=>`<button class="catalog-item ${x.code===selectedCode?'selected':''}" data-item="${x.code}"><strong>${escapeHTML(x.name)}</strong><small>${x.code} · ${escapeHTML(x.category)}</small></button>`).join(''):'<div class="empty">일치하는 간호활동이 없어요. 검색어나 카테고리 필터를 확인하세요.</div>';const item=F.catalog.find(x=>x.code===selectedCode);el('selected-empty').hidden=!!item;el('selected-detail').hidden=!item;if(item){el('selected-item').innerHTML=`<strong>${escapeHTML(item.name)}</strong><p class="code">${item.code}</p><p class="help">${escapeHTML(item.category)} · ${item.type}</p><p class="help">${item.validation} · 실제 nU 처방 가능 여부 미확인</p>`;renderDetailForm();}}

/* v0.2.5: form inputs are UI-only; date/time becomes immutable ISO slots on draft creation. */
function updateScheduleFields(){
 const k=el('schedule-kind').value;
 el('schedule-start-field').hidden=!['once','interval'].includes(k);
 el('schedule-interval-fields').hidden=k!=='interval';
 el('schedule-condition-field').hidden=k!=='conditional';
}
function clearScheduleForm(){
 el('schedule-kind').value='unspecified';el('schedule-start').value='';
 el('schedule-every').value='8';el('schedule-count').value='3';el('schedule-condition').value='';
 updateScheduleFields();
}
function selectedSchedule(){
 const kind=el('schedule-kind').value;
 if(kind==='unspecified')return null;
 if(kind==='conditional')return {kind,condition:el('schedule-condition').value};
 const text=el('schedule-start').value;
 if(!text)throw Error('시작 예정 시각을 선택해 주세요.');
 const date=new Date(text);
 if(!Number.isFinite(date.getTime()))throw Error('예정 시각을 확인해 주세요.');
 return {kind,startAt:date.toISOString(),...(kind==='interval'?{everyHours:Number(el('schedule-every').value),count:Number(el('schedule-count').value)}:{})};
}
function scheduleHTML(order){
 const p=D.scheduleOverview(state,order);
 if(p.kind==='unspecified')return '<div class="schedule-summary">예정: 미지정 · 이전 처방의 예정 횟수를 추정하지 않습니다.</div>';
 if(p.kind==='conditional')return `<div class="schedule-summary">조건부 · 예정 횟수 미정 · 조건: ${escapeHTML(p.condition)}</div>`;
 const text=p.kind==='once'?'일회성':'주기 반복';
 return `<div class="schedule-summary">예정: ${text} · ${p.planned}회${p.kind==='interval'?' · '+order.schedule.everyHours+'시간 간격':''}</div>
 <div class="schedule-slots" aria-label="개별 예정 시점">${p.slots.map(s=>`<div class="schedule-slot"><span class="code">${escapeHTML(s.id)}</span><span>예정 ${fmt(s.at)} · ${s.status==='planned'?'예정':s.status==='held'?'보류':'취소'}</span><span>연결 수행 ${s.executions.length}건 · 연결 기록 ${s.records.length}건</span>${order.status==='confirmed'&&s.status==='planned'? `<button data-execute="${escapeHTML(order.id)}" data-slot="${escapeHTML(s.id)}">이 예정에 모의 수행 연결</button>`:''}</div>`).join('')}</div>
 ${p.unassigned? `<div class="help">예정과 연결되지 않은 수행 ${p.unassigned}건 · 자동 배정하지 않음</div>`:''}`;
}

function renderOrders(){
 const s=D.summary(state,patientId);
 el('summary').innerHTML=[['개별 처방',s.orders],['확정 처방',s.confirmed],['임시저장',s.drafts],['예정 시점',s.plannedSlots],['예정 미정 처방',s.unknownPlans],['실제 수행 사건',s.executions],['기록 건수',s.records]].map(([name,n])=>`<div class="metric"><strong>${n}</strong><span>${name}</span></div>`).join('');
 const container=el('order-list');
 const openedGroups=new Set([...container.querySelectorAll('details.order-group[open]')].map(e=>e.dataset.group));
 const openedOrders=new Set([...container.querySelectorAll('details.order-history[open]')].map(e=>e.dataset.order));
 const groups=D.groupPatientOrders(F,state,patientId,{status:el('status-filter').value,query:el('status-query').value});
 const rows=groups.flatMap(g=>g.items);
 const grouped=el('group-by-code').checked;
 container.innerHTML=rows.length?(grouped?groups.map(g=>groupHTML(g)).join(''):rows.map(orderHTML).join('')):'<div class="empty">선택한 조건의 가상 처방이 없습니다.</div>';
 for(const detail of container.querySelectorAll('details.order-group'))if(openedGroups.has(detail.dataset.group))detail.open=true;
 for(const detail of container.querySelectorAll('details.order-history'))if(openedOrders.has(detail.dataset.order))detail.open=true;
}
function groupHTML(group){
 if(group.items.length<2)return orderHTML(group.items[0]);
 const entry=F.catalog.find(c=>c.code===group.code);
 const planCounts=group.items.map(x=>D.scheduleOverview(state,x.order));
 const planned=planCounts.reduce((n,x)=>n+(x.planned??0),0),unknown=planCounts.filter(x=>x.planned===null).length;
 const statuses=Object.entries(group.statusCounts).map(([key,count])=>`${status[key]||key} ${count}건`).join(' · ');
 return `<details class="order-group" data-group="${escapeHTML(group.patientId+'|'+group.code)}"><summary><span class="group-head"><span class="group-title">${escapeHTML(entry?.name||group.code)} <small>${escapeHTML(group.code)}</small></span><span class="group-counts">개별 처방 <b>${group.items.length}</b>건 · 예정 <b>${planned}</b>회${unknown?` (미정 ${unknown}건)`:''} · 수행 <b>${group.executions}</b>건 · 기록 <b>${group.records}</b>건</span></span><span class="group-status">${escapeHTML(statuses)} · 펼쳐서 개별 처방 확인</span></summary><p class="help">같은 코드별 조회용 묶음이며 부위·방법·빈도 등 임상 조건의 동등성은 확인하지 않았습니다.</p>${group.items.map(orderHTML).join('')}</details>`;
}
function orderHTML(x){const o=x.order,it=F.catalog.find(c=>c.code===o.code);const confirmed=o.status==='confirmed';const events=x.executions.map(e=>{const linked=state.links.filter(l=>l.executionId===e.id).map(l=>x.records.find(r=>r.id===l.recordId)).filter(Boolean);return `<div class="event"><b>수행 ${escapeHTML(e.id)}</b> · ${fmt(e.at)} · ${escapeHTML(label(e.by))}${e.slotId?` · 예정 연결 ${escapeHTML(e.slotId)}`:' · 예정 미연결'}<small>${escapeHTML(e.note||'메모 없음')}</small>${linked.map(d=>`<div class="event"><b>기록 ${escapeHTML(d.id)}</b> · ${fmt(d.at)} · ${escapeHTML(label(d.by))}<small>${escapeHTML(d.note)}</small></div>`).join('')||'<small>연결 기록 없음(누락 판정 아님)</small>'}${confirmed?`<div class="record-box"><input data-note-for="${e.id}" aria-label="${e.id} 기록 내용" maxlength="500" placeholder="수행에 연결할 가상 기록 작성"><button data-record="${e.id}">모의 기록</button></div>`:''}</div>`}).join('');const unmatched=x.records.filter(d=>!state.links.some(l=>l.recordId===d.id));return `<article class="order-card"><div class="order-top"><div><div class="order-title">${escapeHTML(it?.name||o.code)}</div><div class="code">${o.code} · ${escapeHTML(o.id)}</div></div><span class="badge ${o.status}">${status[o.status]||o.status}</span></div><div class="meta">처방자: ${escapeHTML(label(o.orderedBy))} / ${fmt(o.createdAt)}</div><div class="meta">확인자(재인증): ${escapeHTML(o.checkedBy?label(o.checkedBy):'미확인')} / ${fmt(o.confirmedAt)}</div><div class="detail-preview">${detailHTML(o.details)}</div>${scheduleHTML(o)}<div class="statsline"><span>수행 <b>${x.executions.length}</b>건</span><span>기록 <b>${x.records.length}</b>건</span><span>근무조 ${escapeHTML(o.shift||'미확인')}</span></div><div class="order-actions">${o.status==='draft'?`<button class="primary" data-confirm="${o.id}">재인증 후 확정</button>`:''}${confirmed?`<button data-execute="${o.id}">모의 수행 추가</button>`:''}<button data-view="${o.id}">상세 이력 펼치기</button></div><details class="order-history" data-order="${escapeHTML(o.id)}" id="details-${o.id}"><summary>수행·기록·감사 이력</summary><div class="meta">처방 메모: ${escapeHTML(o.note||'없음')}</div><div class="detail-record">${detailHTML(o.details)}</div>${events||'<p class="help">수행 이력이 없습니다.</p>'}${unmatched.length?`<p class="help">연결되지 않은 기록 ${unmatched.length}건(개별 확인 필요)</p>`:''}<div class="meta">감사 이벤트</div>${x.audit.map(a=>`<div class="event">${escapeHTML(a.action)} · ${fmt(a.at)} · ${escapeHTML(label(a.by))}</div>`).join('')}</details></article>`;}
function render(){renderLogin();renderPatients();renderTabs();if(state){renderCatalog();renderOrders();renderCaseSheet();}}
function showConfirm(orderId){logged();const o=state.orders.find(x=>x.id===orderId);if(!o||o.status!=='draft')throw Error('임시저장 상태가 아닙니다.');if(o.orderedBy!==session.userId)throw Error('현재 데모에서는 저장한 계정에서만 재인증합니다.');confirmId=orderId;el('confirm-summary').textContent=`${F.catalog.find(x=>x.code===o.code)?.name} · ${o.patientId} · 처방자 ${label(o.orderedBy)}`;el('confirm-error').textContent='';el('confirm-pin').value='';el('confirm-modal').showModal();el('confirm-pin').focus();}
function init(){const cats=[...new Set(F.catalog.map(x=>x.category))];el('category').innerHTML='<option value="">전체 간호활동</option>'+cats.map(c=>`<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');renderAccountOptions();load();if(state)render();
 el('shift').addEventListener('change',()=>{session=null;renderAccountOptions();renderLogin();notice('근무조가 바뀌어 로그아웃되었습니다.');});
 el('login').addEventListener('click',()=>guarded(()=>{const userId=el('account').value,shift=el('shift').value,pin=el('password').value;if(!D.authenticate(F,userId,shift,pin))throw Error('계정·근무조·비밀번호가 일치하지 않습니다.');session={userId,shift};el('password').value='';notice('로그인했습니다. 이후 저장·확인은 이 가상 간호사 계정으로 기록됩니다.');renderLogin();}));
 el('logout').addEventListener('click',()=>{session=null;notice('로그아웃했습니다.');renderLogin();});
 el('patient-list').addEventListener('click',e=>{const btn=e.target.closest('[data-patient]');if(!btn)return;patientId=btn.dataset.patient;selectedCode=null;lastFormCode=null;el('order-note').value='';clearScheduleForm();notice('가상 환자를 변경했습니다. 처방·이력은 환자별로 분리됩니다.');render();});
 for(const id of ['search','status'])el('tab-'+id).addEventListener('click',()=>{tab=id;render();});
 for(const id of ['query','category'])el(id).addEventListener(id==='query'?'input':'change',renderCatalog);
 el('clear-search').addEventListener('click',()=>{el('query').value='';el('category').value='';renderCatalog();});
 el('catalog-list').addEventListener('click',e=>{const btn=e.target.closest('[data-item]');if(!btn)return;selectedCode=btn.dataset.item;clearScheduleForm();renderCatalog();});
 el('schedule-kind').addEventListener('change',updateScheduleFields);updateScheduleFields();
 el('detail-product').addEventListener('change',updateProductHelp);el('detail-method').addEventListener('change',()=>refreshProductChoices());el('detail-product-category').addEventListener('change',()=>refreshProductChoices());
 el('save-draft').addEventListener('click',()=>guarded(()=>{logged();if(!selectedCode)throw Error('먼저 간호활동을 선택하세요.');const res=D.createDraft(F,state,session,patientId,selectedCode,el('order-note').value,selectedDetails(),selectedSchedule());withChange(res,'임시저장했습니다. ' + res.order.id+' · 확정은 현재 계정 재인증이 필요합니다.');el('order-note').value='';clearScheduleForm();tab='status';render();}));
 el('refresh').addEventListener('click',renderOrders);for(const id of ['status-filter','status-query'])el(id).addEventListener(id==='status-query'?'input':'change',renderOrders);el('group-by-code').addEventListener('change',renderOrders);
 el('order-list').addEventListener('click',e=>guarded(()=>{const target=e.target.closest('button');if(!target)return;if(target.dataset.view){const detail=el('details-'+target.dataset.view);detail.open=!detail.open;return;}if(target.dataset.confirm){showConfirm(target.dataset.confirm);return;}if(target.dataset.execute){logged();const res=D.addExecution(F,state,session,target.dataset.execute,'사용자가 추가한 모의 수행',target.dataset.slot||null);withChange(res,'모의 수행 사건을 추가했습니다. 실제 수행 기록이 아닙니다.');return;}if(target.dataset.record){logged();const id=target.dataset.record;const input=el('order-list').querySelector(`[data-note-for="${id}"]`);const next=D.addRecord(F,state,session,id,input?.value);withChange(next,'연결 기록을 추가했습니다.');}}));
 el('confirm-form').addEventListener('submit',e=>{e.preventDefault();try{logged();const next=D.confirmDraft(F,state,session,confirmId,el('confirm-pin').value);el('confirm-modal').close();confirmId=null;el('confirm-pin').value='';withChange(next,'동일 계정 재인증을 마쳐 가상 처방을 확정했습니다.');}catch(err){el('confirm-error').textContent=err.message;el('confirm-pin').value='';}});
 el('cancel-confirm').addEventListener('click',()=>{el('confirm-modal').close();confirmId=null;});
 el('reset').addEventListener('click',()=>{if(!window.confirm('이 브라우저에 저장한 모든 모의 처방·수행·기록을 지우고 초기 합성 자료로 되돌릴까요?'))return;state=D.makeSeed(F);persist();session=null;selectedCode=null;tab='search';clearScheduleForm();render();notice('테스트 데이터를 초기화했습니다. 변경 이력은 되돌릴 수 없습니다.');});
}
window.addEventListener('DOMContentLoaded',init);
})();
