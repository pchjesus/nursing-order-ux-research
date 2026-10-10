# 간호활동별 세부 조건과 실제 제품·기구 참고 모델 v0.2.3

작성: 2026-10-10 · **독립형 합성 시뮬레이션** · 임상 적합성/기관 비치/허가 상태 검증 아님

## 1. 적용 내용
- 기존 합성 목록 **315건(ACT 214/FOLLOW 42/MAT 59)** 보존. 기존 UI 선택 후보 **38건 모두 유지**.
- 원본 ACT 목록에 실제로 존재하는 **SIM-ACT-0039 (세트 연결부 확인), 0040 (세트 교체 관련 관리), 0041 (주입 속도 확인), 0042 (주입펌프 상태 확인)**를 UI 선택 항목에 추가 → **42건**.
- 제품 참조는 새 독립 목록 **18건(제조사 확인 브랜드/제품군 12건, 제조사 미지정 일반 유형 6건)**. 원본 MAT 및 실제 제품 등록번호를 대체하지 않음.
- 활동별 **부위·목적·빈도·방법·관련 제품ID**를 별도 필드로 선택할 수 있고, 가상 개별 처방에만 선택값을 저장. 독립적인 수행·기록·처방 ID는 기존대로 유지.
- 활동 후보는 처방 가능 여부가 검증된 항목이 아니며 제품의 선택은 자동 처방/제조사 호환성 확인/실제 간호 수행을 의미하지 않음.

## 2. 10개 활동 카테고리 적용 범위
| 현재 UI 카테고리 | 활동 수 | 상세 조건 표현 (모두 가상) | 제품 후보 적용 기준 |
|---|---:|---|---|
| 초기평가·기본감시 | 5 | 측정 부위·사정 목적·빈도·방법 | 산소포화도 측정에 맥박산소 센서 제품군, 그 외 불필요 시 제품 없음 |
| 호흡·기도관리 | 8 | 비강·구강·인두·기관절개관·기관내관 구별, 관찰/흡인 맥락 | 구강 인두 흡인 관련 Yankauer; 산소 상태 감시에 센서 유형; 기타 무리한 연계 안 함 |
| 정맥주입·혈관접근 | 9 | 말초/중심/수액라인/연결부, 중력식·미세방울·유량조절기형·펌프 방식 | 각 방법 관련 세트의 유형 후보만. 펌프 상태 확인은 펌프 세트 제품군으로 한정 |
| 상처·피부·드레싱 | 8 | 부위·창상보호·드레싱 유형·관찰·반복 조건 | 듀오덤·테가덤·폼·피부보호 등 활동 관련 후보. **순수 사정에는 물품 강제 선택 없음** |
| 배뇨·도뇨 관리 | 5 | 유치도뇨관·배액관·상태·배액량/감염 관찰 | 도뇨관 관리/연결 확인 시 BD Bardex 및 일반 배액백 유형 참고 |
| 안전·낙상·억제 | 1 | 전신·침상 주변, 예방/위험도 관련 선택 | 제품 미선택 가능(위험도 측정만으로 제품 처방하지 않음) |
| 활동·재활·자세 | 1 | 전신/천골/발꿈치, 체위변경·예방 목적 | 보조쿠션 등 일반 유형 |
| 위생·안위·통증 | 1 | 구강·점막·통증 부위 등의 관찰/간호 | 활동과 무관한 제품 강제 추천 없음 |
| 교육·심리·퇴원관리 | 2 | 환자·보호자, 자가관리 교육·지지 | 물품 선택 기본 없음 |
| 완화·호스피스·지역사회 | 2 | 통증 사정/가족 지원 등 목적·방법 | 물품 선택 기본 없음 |

**설계상 주의:** 초기 38개에서 각 영역의 대표 활동만 추출했으므로 상기 카테고리 수는 전체 315개 자료의 항목 수와 다르다. 카테고리/부위/목적 선택지는 사용자 기능 실험용 **예시**이지 실제 병원 처방 가능 조건, 권한 또는 임상 프로토콜이 아니다.

## 3. 실제 제조사에서 존재를 확인한 제품/제품군 후보
| 합성 제품ID | 제조사 확인 상품/제품군 | 원본 임상 의미 (간단 범주만) | 공식 원문 |
|---|---|---|---|
| SIM-PRD-001 | ConvaTec DuoDERM Extra Thin | 하이드로콜로이드 드레싱 | https://www.convatec.com/products/advanced-wound-care/wound-type/pc-wound-diabetic-foot-ulcers/duoderm-extra-thin-dressing/ |
| SIM-PRD-002 | ConvaTec DuoDERM CGF | 다른 하이드로콜로이드 드레싱 제품 | https://www.convatec.com/products/advanced-wound-care/wound-type/pc-wound-leg-ulcers/duoderm-cgf-sterile-dressing/ |
| SIM-PRD-003 | 3M Tegaderm Transparent Film | 투명 필름 드레싱 | https://www.3m.co.kr/3M/ko_KR/p/d/b00035590/ |
| SIM-PRD-004 | Smith+Nephew ALLEVYN GENTLE BORDER | 폼 드레싱 제품군 | https://www.smith-nephew.com/en/health-care-professionals/products/wound-care/foam-dressing |
| SIM-PRD-005 | Solventum Cavilon No Sting Barrier Film | 피부 보호막 필름 | https://www.solventum.com/ko-kr/home/f/b00042019/ |
| SIM-PRD-006 | B. Braun Infusomat Space Line PVC | 특정 펌프와 호환되는 전용 세트 제품군 | https://catalogs.bbraun.com/p/PRID00001828/infusomat-space-line-pvc |
| SIM-PRD-007 | BD Alaris Pump Module Sets | 펌프용 수액세트 제품군 | https://www.bd.com/en-us/products-and-solutions/products/product-families/bd-alaris-pump-module-administration-sets |
| SIM-PRD-008 | B. Braun Dosifix SafeSet | 챔버형 용량 조절 수액세트 | https://catalogs.bbraun.com/en-01/p/PRID00012224/dosifix-safeset |
| SIM-PRD-009 | BD PosiFlush | 사전충전 플러시 주사기 제품군 | https://www.bd.com/en-us/products-and-solutions/products/product-families/bd-posiflush-pre-filled-saline-syringe |
| SIM-PRD-010 | Medline Yankauer 관련 제품군 | 구강·인두 흡인 관련 기구 | https://www.medline.com/product/Suction-Handle/Yankauers/Z05-PF64569 |
| SIM-PRD-011 | Masimo RD SET | 맥박산소측정 센서 제품군 | https://www.masimo.com/products/sensors/rd-set/ |
| SIM-PRD-012 | BD Bardex I.C. Foley Catheter | 유치도뇨관 제품군 | https://www.bd.com/en-us/products-and-solutions/products/product-families/foley-catheters |

이름이 확인된 것이며 **실제 국내 유통/기관 비치/환자별 적응증/펌프 기종·소모품 호환성/사용자 권한을 검증했다는 의미는 아님**. 링크는 제조사 제품 소개이며 독립된 임상적 처방 근거가 아니다. 제품/모델/포장규격 및 현지 판매 여부는 제조사 사용설명서와 기관 지침으로 별도 확인해야 한다.

### 일반 유형 6개 (SIM-GEN-*)
- 일반 중력식 수액세트, **도지플로우 계열 유량조절기형 세트**, 미세방울 수액세트, 유치도뇨관/배액백, 체위변경 보조쿠션, 맥박산소측정기 센서.
- '도지플로우'는 사용자가 제시한 현장 표현을 **제품 유형 예시**로 보존했으며 특정 제조사 상표/등록제품으로 확인하지 않았다. **B. Braun Dosifix는 별도 챔버형 세트 제품명으로, 도지플로우와 동일 제품이라고 단정하지 않는다.**

## 4. 제품/간호활동/개별 처방 관계
`ACT` = 간호행위 후보. `MAT` = 원본 물품 유형. `SIM-PRD-*` = 참고 제품명, `SIM-GEN-*` = 비브랜드 재료 유형. `order.id` = 개별 모의 간호처방.

- 신규 UI 선택: `code` → 프로필의 `site/purpose/frequency/method` → 선택한 제품ID(없어도 가능) → `createDraft` 호출.
- 저장: 기존 `order`에 **선택적** `details` 객체를 추가한다. 기존 상태 `schema=2`, `localStorage` 키 `nursing-order-demo-v02` 그대로 유지. 과거 처방에 `details`가 없으면 '**세부 조건 미기재**'로 명시한다.
- `details.productId`가 있으면 선택 당시 `productName`, `productKind`도 스냅샷으로 보관한다. 이후 제품 목록의 이름만 변경해도 **옛 처방 표시를 임의 변경하지 않음**.
- 사용자가 고른 부위/방법은 다른 환자/다른 처방으로 전파되지 않음. `patientId`·`order.id`는 개별 유지.
- 유사 코드 그룹화는 현재와 동일하게 화면 요약에만 사용; **조건과 브랜드가 다른 처방도 임상적으로 동등하다고 판정하지 않음**.
- 드레싱 관련 제품 선택은 처치·관찰의 도메인 관계를 표기할 뿐, 특정 환자 적용을 권장하지 않는다.
- 펌프 상태 확인 항목은 도지플로우 유형과 분리, '펌프 방식' 선택 시 일반/유량조절기 전용 제품의 잘못된 조합을 모의 저장 단계에서 거절한다. **제품군 수준에서만 예시 구분하며 제품별 호환성 검증은 아님**.

## 5. 기존 기능 및 위험 검토
| 위험 | 현재 보호장치 | 미검증 사항 |
|---|---|---|
| 과거 저장 데이터 파손 | 선택적 필드 사용, 스키마 2 및 키 불변, 과거 객체 허용 | 제품 ID 제거 시 과거 참조 처리를 위한 향후 버전/이관 정책 |
| 서로 다른 타입 혼동 | ACT만 직접 선택 가능; 원본 MAT/FOLLOW 비변경; 제품 별도 객체 | 간호사 실제 처방 권한·병원 분류 |
| 잘못된 제품 자동 추천 | 추천 알고리즘/용량 계산 없음, 사용자가 명시적 선택, 관련 활동으로 노출 제한 | 현지 임상 적합성/제조사 IFU 및 기관 정책 |
| 수액세트/펌프 혼동 | 주입 속도 vs 펌프 상태 활동 분리, 방식–유형 일부 조합 거부 | 실제 기종별 수액세트 호환성 검증 |
| 반복 그룹 정보 손실 | 원본 ID·세부 조건 유지, 보기용 그룹만 허용 | 임상적 동일 처방의 정의 |
| 기존 UI 의존성 | 데이터 옵션 로직 `activity-details.js`와 domain 분리; 패널 교체 가능 | 향후 UI 접근성/사용성 시험 |

## 6. 자료 사용 원칙
학교 실습자료의 처방지/Kardex 구성만 참고하며 실제 환자·의료기관 내부 코드·학교 자료의 약물 용량은 복제하지 않는다. 세 시스템(PRN/MICU/간호처방)의 실제 통합 및 공통 DB는 **사용자 승인 전 보류**.

## 7. 참고문헌 (APA 7 간략 웹자료)
- B. Braun. (n.d.). *Dosifix SafeSet*. https://catalogs.bbraun.com/en-01/p/PRID00012224/dosifix-safeset
- B. Braun. (n.d.). *Infusomat Space Line PVC*. https://catalogs.bbraun.com/p/PRID00001828/infusomat-space-line-pvc
- BD. (n.d.). *BD Alaris Pump Module administration sets*. https://www.bd.com/en-us/products-and-solutions/products/product-families/bd-alaris-pump-module-administration-sets
- BD. (n.d.). *Foley catheters*. https://www.bd.com/en-us/products-and-solutions/products/product-families/foley-catheters
- ConvaTec. (n.d.). *DuoDERM Extra Thin dressing*. https://www.convatec.com/products/advanced-wound-care/wound-type/pc-wound-diabetic-foot-ulcers/duoderm-extra-thin-dressing/
- ConvaTec. (n.d.). *DuoDERM CGF sterile dressing*. https://www.convatec.com/products/advanced-wound-care/wound-type/pc-wound-leg-ulcers/duoderm-cgf-sterile-dressing/
- Masimo. (n.d.). *RD SET sensors*. https://www.masimo.com/products/sensors/rd-set/
- Medline. (n.d.). *Suction handle*. https://www.medline.com/product/Suction-Handle/Yankauers/Z05-PF64569
- Smith+Nephew. (n.d.). *Foam dressing*. https://www.smith-nephew.com/en/health-care-professionals/products/wound-care/foam-dressing
- Solventum. (n.d.). *3M Cavilon No Sting Barrier Film*. https://www.solventum.com/ko-kr/home/f/b00042019/
- 3M Korea. (n.d.). *3M 테가덤 투명 필름 드레싱*. https://www.3m.co.kr/3M/ko_KR/p/d/b00035590/
