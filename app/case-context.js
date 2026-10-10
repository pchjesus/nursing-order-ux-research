/* Original synthetic cases inspired by the educational worksheet structure, not its people or order codes. */
(function(root,factory){const data=factory();if(typeof module==='object'&&module.exports)module.exports=data;root.DEMO_CASE_CONTEXTS=data;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
return [
 {patientId:'P-A101',scenarioTitle:'복부 수술 후 간호관찰 — 가상 사례',educationSource:'사례기반 실무실습: 1일차의 사례→Kardex→Order Manage 구성 방식 참고',kardex:[
  '입원 사유와 수술 후 경과는 선택한 가상 환자 설명을 기준으로 확인',
  '통증·오심 등 보고 증상과 관찰 결과를 구분하여 기록하는 상황',
  '창상·정맥관 관련 활동은 각각의 가상 간호활동 코드와 개별 처방 상태로 확인'
 ],focus:['활력징후·통증 변화','창상 부위 및 드레싱 상태','말초정맥관 관련 관찰'],skills:['활력징후 측정','창상 사정·드레싱','낙상위험 사정']},
 {patientId:'P-B102',scenarioTitle:'호흡기 증상 관찰 — 가상 사례',educationSource:'ICN 워크리스트 9쪽, 사례기반 실무실습: 3일차 사례 구성 방식 참고',kardex:[
  '호흡곤란 호소 여부와 산소포화도 관찰 정보의 출처를 구분',
  '산소요법 관련 관찰과 실제 약물·산소 처방의 존재를 동일시하지 않음',
  '기도 분비물 사정과 흡인 등 서로 다른 간호활동 후보를 구별하여 조회'
 ],focus:['호흡수·호흡 노력','산소포화도 측정 결과','기도 분비물 관련 사정'],skills:['SpO₂ 측정','호흡상태 사정','기도 간호']},
 {patientId:'P-C103',scenarioTitle:'배뇨·활동 제한 및 피부보호 — 가상 사례',educationSource:'ICN 워크리스트 11~12쪽, 사례기반 실무실습: 4일차 정보 구성 방식 참고',kardex:[
  '가상 환자의 이동 제한과 낙상 위험에 관한 관찰 정보를 별도로 확인',
  '배뇨량 기록, 도뇨관 상태 점검, 도뇨 처치 자체는 다른 행위임을 구별',
  '압박손상 예방 중재와 단순 체위변경의 목적·기록 맥락을 구별'
 ],focus:['배뇨량·도뇨관 상태','낙상 예방','피부 상태 및 체위변경'],skills:['배뇨 상태 관찰','낙상·압박손상 예방','체위변경']},
 {patientId:'P-D104',scenarioTitle:'완화·안위 간호 — 가상 사례',educationSource:'학교 실습자료의 사례→관찰→처방지 정보 구성 형식만 참고 (내용은 독립 합성)',kardex:[
  '증상 보고·관찰·수행기록을 서로 다른 시점과 작성자로 확인',
  '통증 사정, 구강간호, 가족 지지 등 독립 간호행위의 맥락을 구별',
  '간호활동 목록에 있다는 이유만으로 실제 병원 처방 가능성을 단정하지 않음'
 ],focus:['통증 및 불편감','구강 상태·안위','정서적 지지 요구'],skills:['통증 사정','구강간호','대상자·가족 지지']}
];
});
