/* Synthetic activity-detail reference: optional metadata, never an automated clinical recommendation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.NursingDetailCatalog=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const NEW_ACTIVITIES=[
 {code:'SIM-ACT-0039',name:'정맥주입 세트 연결부 확인',category:'정맥주입·혈관접근',type:'ACT',aliases:['수액세트','연결부','flow'],validation:'임상 검증 전'},
 {code:'SIM-ACT-0040',name:'정맥주입 세트 교체 관련 관리',category:'정맥주입·혈관접근',type:'ACT',aliases:['수액세트','세트교체','도지플로우'],validation:'임상 검증 전'},
 {code:'SIM-ACT-0041',name:'수액 주입 속도 확인',category:'정맥주입·혈관접근',type:'ACT',aliases:['도지플로우','유량조절기','infusion'],validation:'임상 검증 전'},
 {code:'SIM-ACT-0042',name:'수액 주입펌프 상태 확인',category:'정맥주입·혈관접근',type:'ACT',aliases:['인퓨전 펌프','infusion pump'],validation:'임상 검증 전'}
];
/* Branded entries have official manufacturer references. Other entries are generic material types. */
const PRODUCTS=[
 {id:'SIM-PRD-001',name:'듀오덤 DuoDERM Extra Thin',manufacturer:'ConvaTec',kind:'하이드로콜로이드 드레싱',family:'dressing',url:'https://www.convatec.com/products/advanced-wound-care/wound-type/pc-wound-diabetic-foot-ulcers/duoderm-extra-thin-dressing/',verified:'제조사 제품명 확인'},
 {id:'SIM-PRD-002',name:'듀오덤 DuoDERM CGF',manufacturer:'ConvaTec',kind:'하이드로콜로이드 드레싱',family:'dressing',url:'https://www.convatec.com/products/advanced-wound-care/wound-type/pc-wound-leg-ulcers/duoderm-cgf-sterile-dressing/',verified:'제조사 제품명 확인'},
 {id:'SIM-PRD-003',name:'Tegaderm 투명 필름 드레싱',manufacturer:'3M',kind:'투명 필름',family:'dressing',url:'https://www.3m.co.kr/3M/ko_KR/p/d/b00035590/',verified:'제조사 제품명 확인'},
 {id:'SIM-PRD-004',name:'ALLEVYN GENTLE BORDER',manufacturer:'Smith+Nephew',kind:'폼 드레싱',family:'dressing',url:'https://www.smith-nephew.com/en/health-care-professionals/products/wound-care/foam-dressing',verified:'제조사 제품군 확인'},
 {id:'SIM-PRD-005',name:'Cavilon No Sting Barrier Film',manufacturer:'Solventum',kind:'피부 보호 필름',family:'skin',url:'https://www.solventum.com/ko-kr/home/f/b00042019/',verified:'제조사 제품명 확인'},
 {id:'SIM-PRD-006',name:'Infusomat Space Line PVC',manufacturer:'B. Braun',kind:'펌프 전용 수액세트',family:'infusion-pump',url:'https://catalogs.bbraun.com/p/PRID00001828/infusomat-space-line-pvc',verified:'제조사 제품명 확인'},
 {id:'SIM-PRD-007',name:'Alaris Pump Module Infusion Set',manufacturer:'BD',kind:'펌프용 수액세트 제품군',family:'infusion-pump',url:'https://www.bd.com/en-us/products-and-solutions/products/product-families/bd-alaris-pump-module-administration-sets',verified:'제조사 제품군 확인'},
 {id:'SIM-PRD-008',name:'Dosifix SafeSet',manufacturer:'B. Braun',kind:'용량 챔버형 수액세트',family:'infusion-gravity',url:'https://catalogs.bbraun.com/en-01/p/PRID00012224/dosifix-safeset',verified:'제조사 제품명 확인'},
 {id:'SIM-PRD-009',name:'BD PosiFlush',manufacturer:'BD',kind:'사전충전 플러시 주사기',family:'iv-accessory',url:'https://www.bd.com/en-us/products-and-solutions/products/product-families/bd-posiflush-pre-filled-saline-syringe',verified:'제조사 제품군 확인'},
 {id:'SIM-PRD-010',name:'Yankauer 흡인 기구 (예: Medline)',manufacturer:'Medline',kind:'구강·인두 흡인 기구',family:'airway',url:'https://www.medline.com/product/Suction-Handle/Yankauers/Z05-PF64569',verified:'제조사 제품군 확인'},
 {id:'SIM-PRD-011',name:'Masimo RD SET 센서',manufacturer:'Masimo',kind:'맥박산소측정 센서 제품군',family:'monitor',url:'https://www.masimo.com/products/sensors/rd-set/',verified:'제조사 제품군 확인'},
 {id:'SIM-PRD-012',name:'Bardex I.C. Foley catheter',manufacturer:'BD',kind:'유치도뇨관 제품군',family:'urinary',url:'https://www.bd.com/en-us/products-and-solutions/products/product-families/foley-catheters',verified:'제조사 제품군 확인'},
 {id:'SIM-GEN-001',name:'일반 중력식 수액세트',manufacturer:null,kind:'수액세트 유형',family:'infusion-gravity',url:null,verified:'제품 유형 예시·제조사 미지정'},
 {id:'SIM-GEN-002',name:'도지플로우 계열 유량조절기형 세트',manufacturer:null,kind:'유량조절기형',family:'infusion-flow',url:null,verified:'현장 용어 예시·제조사/모델 미확인'},
 {id:'SIM-GEN-003',name:'미세방울 수액세트',manufacturer:null,kind:'수액세트 유형',family:'infusion-gravity',url:null,verified:'제품 유형 예시·제조사 미지정'},
 {id:'SIM-GEN-004',name:'유치도뇨관 및 연결 배액백',manufacturer:null,kind:'도뇨 관리 기구 유형',family:'urinary',url:null,verified:'제품 유형 예시·제조사 미지정'},
 {id:'SIM-GEN-005',name:'체위변경 보조쿠션',manufacturer:null,kind:'자세 유지 물품 유형',family:'position',url:null,verified:'제품 유형 예시·제조사 미지정'},
 {id:'SIM-GEN-006',name:'맥박산소측정기 센서',manufacturer:null,kind:'모니터링 기구 유형',family:'monitor',url:null,verified:'제품 유형 예시·제조사 미지정'}
];
const DRESS=['SIM-ACT-0033','SIM-ACT-0043','SIM-ACT-0052','SIM-ACT-0053','SIM-ACT-0054','SIM-ACT-0059','SIM-ACT-0063'];
const WOUND=['SIM-ACT-0049','SIM-ACT-0050','SIM-ACT-0060'];
const AIR=['SIM-ACT-0017','SIM-ACT-0018','SIM-ACT-0025','SIM-ACT-0026','SIM-ACT-0027','SIM-ACT-0028','SIM-ACT-0030','SIM-ACT-0031'];
const IV=['SIM-ACT-0032','SIM-ACT-0036','SIM-ACT-0037','SIM-ACT-0039','SIM-ACT-0040','SIM-ACT-0041','SIM-ACT-0042'];
const URINARY=['SIM-ACT-0075','SIM-ACT-0076','SIM-ACT-0080','SIM-ACT-0081','SIM-ACT-0084'];
const RISK=['SIM-ACT-0011','SIM-ACT-0012','SIM-ACT-0132','SIM-ACT-0144'];
const defaultProfile={sites:['전신','해당 부위','미정'],purposes:['사정·관찰','상태 확인','예방·교육','미정'],frequencies:['단회','매 근무조','일 1회','필요시(PRN)','별도 지시 확인','미정'],methods:['기본 사정·관찰','교육·상담','상태 확인','미정'],families:[]};
function profileFor(activity){
 const p={sites:defaultProfile.sites,purposes:defaultProfile.purposes,frequencies:defaultProfile.frequencies,methods:defaultProfile.methods,families:[]};
 if(DRESS.includes(activity.code)||WOUND.includes(activity.code)){p.sites=['수술부위','천골·둔부','발꿈치','사지','혈관접근 삽입부','배액관 삽입부','기타 부위','미정'];p.purposes=['드레싱 상태 확인','창상 보호','삼출·피부 관찰','관련 부위 교육','미정'];p.methods=['일반 창상 관리','멸균 드레싱 관련 관리','드레싱 상태 사정','교체 준비·확인','미정'];p.families=WOUND.includes(activity.code)?[]:['dressing','skin'];}
 else if(AIR.includes(activity.code)){p.sites=['호흡기·기도','구강·인두','기관절개관','기관내관','비강','미정'];p.purposes=['호흡 상태 관찰','기도 분비물 관련 확인','산소 전달 기구 관리','흡인 전후 상태 확인','교육','미정'];p.methods=['산소포화도 관찰','비강캐뉼라 상태 확인','구강·인두 흡인 관련','기관절개관 흡인 관련','기관내관 흡인 관련','미정'];p.families=activity.code==='SIM-ACT-0026'?['airway']:(activity.code==='SIM-ACT-0017'?['monitor']:[]);}
 else if(IV.includes(activity.code)||activity.code==='SIM-ACT-0033'){p.sites=['말초정맥관','중심정맥관','수액세트 연결부','수액 주입라인','미정'];p.purposes=['연결부 확인','주입속도 확인','세트 상태 관찰','주입펌프 상태 확인','삽입부 사정','미정'];p.methods=['중력식 일반세트','미세방울세트','도지플로우(유량조절기형)','인퓨전 펌프 전용세트','기타·미정'];p.families=['SIM-ACT-0039','SIM-ACT-0040','SIM-ACT-0041','SIM-ACT-0042'].includes(activity.code)?['infusion-gravity','infusion-flow','infusion-pump']:[];if(!p.families.length)p.methods=['삽입부 사정','주입 관련 관찰','상태 확인','미정'];if(activity.code==='SIM-ACT-0042'){p.methods=['인퓨전 펌프 전용세트','기타·미정'];p.families=['infusion-pump'];}}
 else if(URINARY.includes(activity.code)){p.sites=['요도·회음부','유치도뇨관','배액백·연결부','미정'];p.purposes=['배뇨 상태 사정','배액 흐름·연결 확인','감염 징후 관찰','배뇨량 기록','미정'];p.methods=['외관 관찰','배액량 확인','연결부 확인','교육','미정'];p.families=['SIM-ACT-0080','SIM-ACT-0081'].includes(activity.code)?['urinary']:[];}
 else if(RISK.includes(activity.code)){p.sites=['전신','천골·둔부','발꿈치','사지','침상 주변','미정'];p.purposes=['욕창 예방','낙상 예방','체위변경','위험 사정','미정'];p.methods=['위험도 도구 기반 사정','체위변경·지지','기본 관찰','교육','미정'];p.families=['SIM-ACT-0132','SIM-ACT-0144'].includes(activity.code)?['position','skin']:[];}
 else if(activity.code==='SIM-ACT-0007'){p.sites=['손가락','손·발','센서 부착 부위','미정'];p.purposes=['산소포화도 감시','센서 부착상태 확인','측정값 관찰','미정'];p.methods=['맥박산소측정기 센서','모니터링 관찰','미정'];p.families=['monitor'];}
 else if(activity.code==='SIM-ACT-0001'){p.sites=['팔·상완','측정 가능한 부위','전신','미정'];p.purposes=['활력징후 사정','변화 추적','재확인','미정'];p.methods=['비침습 활력징후 측정','측정 결과 기록','미정'];}
 else if(activity.code==='SIM-ACT-0010'){p.sites=['통증 호소 부위','복부','사지','전신','미정'];p.purposes=['통증 강도 사정','통증 양상 사정','중재 전후 비교','미정'];p.methods=['NRS','PQRST','관찰','미정'];}
 else if(activity.category.includes('통증')||activity.code==='SIM-ACT-0203'){p.sites=['전신','통증 호소 부위','구강·점막','미정'];p.purposes=['통증 사정','구강 위생','증상 완화 관련 관찰','미정'];p.methods=['환자 진술 기반 사정','구강간호 관련','상태 확인','미정'];}
 else if(activity.category.includes('교육')||activity.category.includes('호스피스')){p.sites=['환자','보호자·가족','교육 대상 부위','미정'];p.purposes=['자가관리 교육','정서적 지지','가족 지지','증상 관찰','미정'];p.methods=['설명·시범','상담·지지','이해 확인','미정'];}
 return {code:activity.code,sites:[...p.sites],purposes:[...p.purposes],frequencies:[...p.frequencies],methods:[...p.methods],families:[...p.families]};
}
function expandFixtures(base){
 const codes=new Set(base.catalog.map(x=>x.code));const newCatalog=NEW_ACTIVITIES.filter(x=>!codes.has(x.code));
 const catalog=[...base.catalog,...newCatalog].map(x=>({...x,aliases:[...(x.aliases||[])]}));
 return {...base,catalog,products:PRODUCTS.map(x=>({...x})),profiles:Object.fromEntries(catalog.map(x=>[x.code,profileFor(x)]))};
}
function productChoices(fixtures,code,method=''){
 const pf=fixtures.profiles?.[code];if(!pf)return [];
 return fixtures.products.filter(x=>{
  if(!pf.families.includes(x.family))return false;
  if(['SIM-ACT-0033','SIM-ACT-0043','SIM-ACT-0063'].includes(code)&&x.family==='dressing'&&!['SIM-PRD-003'].includes(x.id))return false; // prototype: do not present hydrocolloid/foam as IV site dressing choices
  if(method==='인퓨전 펌프 전용세트')return x.family==='infusion-pump';
  if(method==='도지플로우(유량조절기형)')return x.family==='infusion-flow';
  if(method==='미세방울세트')return x.id==='SIM-GEN-003';
  if(method==='중력식 일반세트')return x.family==='infusion-gravity'&&x.id!=='SIM-GEN-003';
  return true;
 });
}
return {NEW_ACTIVITIES,PRODUCTS,expandFixtures,profileFor,productChoices};
});
