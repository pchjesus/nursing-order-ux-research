# 3개 프로젝트 통합 영향 분석 — 간호처방 v0.2.1
작성: 2026-10-10 · **설계 검토/문서화만** · 코드·저장소·UI 변경 없음

## 0. 검토 범위 및 출처
- PRN: `pchjesus/prn-order-viewer` `main` `e2b662071d400496e6eb6f1da9756e2b0b4f9c31`, [THREE-PROJECT-CONVERGENCE-v0.3](https://github.com/pchjesus/prn-order-viewer/blob/main/docs/THREE-PROJECT-CONVERGENCE-v0.3.md), `order-composer.js`, `data/patients.json`, `roster-bridge.js`.
- 간호처방: 이 저장소 `main` `44ec3ee1540631ff76efdb38e8bc8b4f68469abf`, `app/domain.js`, `app/fixtures.js`, `app/app.js`, `README.md`.
- MICU: `pchjesus/micu-fire-evacuation` `main` `8bf142adce490267943361955921c3c28bba78df` (v0.7.4 RC), `domain/roster-model.js`, `storage.js` 및 README.
- 참고 레퍼런스: 사용자 제공 학교 실습 자료 2종. [PRACTICUM_REFERENCE_MAPPING](../research/PRACTICUM_REFERENCE_MAPPING.md) 참조.
- 각 경로는 **2026-10-10에 확인한 스냅샷**이며, 현재 운영 병원 시스템과 동일하다는 뜻이 아님.

## 1. 현재 구현에서 확인한 사실
| 도메인 | 현재 원본·식별자 | 저장·업무 | 통합 위험 |
|---|---|---|---|
| 간호행위 후보 | 315 합성 후보 중 `ACT` 214, `FOLLOW` 42, `MAT` 59; 시연 `ACT` 38 | `SIM-ACT-*`, 가상코드 검색 | 행위와 물품/연계 수행, 처방 가능 여부 혼동 |
| 간호처방 | `order.id` (`DEMO-O-*`, `O-*`), `patientId`, `code`, `orderedBy`, `checkedBy` | 임시저장 → 동일 계정 PIN 재인증 후 모의 확정; localStorage 스키마 2 | 의사처방·간호활동의 처방자/확인자 의미 혼동; 장기 ID 충돌 가능성 |
| 간호수행·기록 | `execution.id/orderId/patientId`, `record.id/orderId/patientId`, 별도 `links`, `audit` | 별개 사건·기록, 같은 코드 그룹은 화면 표시만 | 1:1 관계 강제, 단순 건수차를 누락으로 오판 |
| PRN 의사약물처방 | `patient_id=DEMO-P*`, `order_id=SIM-ORD-*`, `prescriber_id`, `order_domain=medication` | `createOrder()` + `createEnvelope()`; 신규 처방 탭 메모리, 재로딩 시 소실 | 간호처방 데이터에 직접 참조하면 원본 처방이 사라질 수 있음 |
| PRN 읽음 확인 | `nurse_id`, `shift_id`, `action=read_acknowledgement` | 처방 확인 ≠ 승인 ≠ 투약 | 간호처방 `checkedBy`/재인증과 동등 취급 불가 |
| MICU 근무표 | `roster.id`, `source:<rosterId>:<index>`, 추가 인원 ID | IndexedDB v4, 날짜·듀티별 `getOnDuty` | 근무표 인원 식별자는 안정적 사용자 계정 ID 아님 |
| 환자 | 간호처방 `P-A101` 등 4명; PRN `DEMO-P001` 등 4명 | **서로 다른 가상 환자 집합** | 이름·나이·병상·유사 병력으로 자동 동일인 판정 금지 |

> **기존 PRN 문서에 등장하는 '같은 가상 환자 4명'은 PRN 앱 안에서 같은 4명을 참조한다는 의미이지, 간호처방 앱의 4명과 이미 같은 ID로 연동됐다는 의미가 아니다.**

## 2. 승인된 설계 경계
1. 이 프로젝트의 우선 대상은 **독립적인 간호중재·간호행위(`ACT`)**. 의사 처방의 하위 업무로 일괄 변경하지 않는다.
2. 의사 약물처방과 연결된 간호행위도 존재할 수 있으므로, `related_request_id`는 **선택적인 외부 참조**로 설계한다. `null`은 부적합/누락이 아니라 **독립 간호행위 또는 연결 정보 없음**을 나타낼 수 있다.
3. **환자·직원·처방·수행·기록은 서로 다른 신원**을 유지한다. 환자 매핑·직원 매핑과 처방 연관 링크를 각기 독립 모델로 관리한다.
4. 동일 환자와 임상적으로 관련된 행위라도 의사 처방 ID·간호 처방 ID를 하나의 처방 ID로 병합하지 않는다.
5. `MAT`(소모품/기구), 검사 의뢰, 검체·검체 용기, 드레싱 등 처치, 간호수행을 분리한다. PRN 의사약물 처방을 수행했다는 근거 없이 '투여 완료'로 표시하지 않는다.
6. 화면/정적 처방지 배치는 변경 가능한 표현 계층이다. 코드·원본 간호행위 신원·원본 기록을 UI 편의를 위해 재작성하지 않는다.
7. 미검증된 nU 등록 권한, 간호사의 수행/기록 의무, PRN 투약 가능 여부를 시스템에서 자동 승인하지 않는다.

## 3. 미래 참조 구조와 연결 사례 (전부 제안, 미구현)
```text
SharedPatient (공통 합성 환자 ID)
   ├─ PatientAlias (PRN: DEMO-P001) ── MedicationRequest/MedicationOrder (PRN 고유 order_id)
   └─ PatientAlias (간호: P-A101) ──── NursingOrder (간호 고유 order.id)
                                          │
                                   NursingExecution (event.id)
                                          │
                                   NursingDocument (record.id)
RelatedRequestLink (별도 연결표, 선택)
   nursing_order_id ── related_request_id (PRN 의사처방 request_id)
   relation_type + patient-match + provenance + 검증 상태
SharedStaff (공통 합성 직원 ID)
   └─ StaffAlias (PRN nurse/MD, nursing N-D01, MICU roster person) 별도 매핑
```
- 간호 `ACT` 자체에서 시작한 가상 간호처방: `related_request_id=null` 가능.
- PRN 의사 처방에 대해 간호 관찰·교육 등 활동이 필요한 것으로 **별도 합성 시나리오에 명시된 경우에만** 외부 참조 제안. 의사 처방 생성 즉시 간호행위 자동 생성 금지.
- `related_request_id`와 `order_instance_id`는 **일대일이 아님**: 1개 의사 처방에 여러 개 수행/간호활동이 연결되거나 1개 간호활동과 무관할 수 있다.
- 불필요한 환자 중복·이름충돌 방지 조건은 [SHARED_IDENTITY_LINK_DRAFT](SHARED_IDENTITY_LINK_DRAFT.md) 참조.

## 4. 변경 영향 및 지금 당장 필요한 최소 변경
| 대상 | 이번 단계 | 향후 실제 연계 직전 (별도 승인) |
|---|---|---|
| `data/CATALOG.*` 315건, `app/fixtures.js` | 변경 없음 | 기존 SIM 코드 불변, 새 합성 임상 조건은 별도 속성/보조 테이블 |
| `app/domain.js` 스키마 2 · 로컬 저장 키 | 변경 없음 | 저장 마이그레이션 전 **읽기 전용 어댑터/ID 매핑 실험**, 충돌/복원 테스트 |
| `app/app.js` 검색·그룹·재인증·이력 | 변경 없음 | 연관 출처 링크는 선택적 표시, UI 재구성 시 도메인 회귀검증 |
| PRN `order-composer.js` · 탭 메모리 | 변경 없음 | 영속성/처방 버전/삭제 정책 합의 후 참조 무결성 설계 |
| MICU IndexedDB · 근무표·배치·백업 | 변경 없음 | 읽기 전용 합성 근무표 스냅샷 검증, 직원 ID 매핑 |
| 실습 레퍼런스 | 구조만 정리 | 가상 Kardex/Order Manage 시나리오를 **별도 fixture 제안**으로 작성, 실제 학교 환자·코드 복제 금지 |

**결정:** 이번 단계의 최소 변경은 **문서 추가/갱신만**이다. 기존 앱·의사 앱·MICU 앱 코드, DB, UI, 테스트와 실습 원본은 그대로 둔다.

## 5. 위험·사전 조건
| 위험 | 회피 조건 |
|---|---|
| PRN 처방 새로고침 후 소실 | 외부 키만을 참조해 확정 상태처럼 표시하지 않기; 저장·버전 정책 합의 후 연결 |
| 서로 다른 가상 환자를 같은 환자로 오연결 | 명시적 양방향 가상 환자 매핑 승인; 환자 ID·출처·검증자/상태 기록 |
| 이름·근무자 행의 동명이인/교체 | 전역 직원 ID와 alias 유지; 근무표 존재와 로그인 인증을 분리 |
| 독립 간호행위가 의사 지시로 바뀜 | `related_request_id` optional; 행위의 출처·작성 주체 유지 |
| 검사/검체/용기/물품 혼합 | 도메인 분류 분리, 유형검사·연관관계만 보조 링크로 |
| 의료직종 권한 가정·기록 누락 판정 | 실제 기관 규정 검증 전까지 '모의'·'미확인' 라벨 |
| 대규모 리팩터링/저장소 합병 회귀 | 현재 도메인 및 UI 보존, 단계별 스냅샷·읽기 전용 검증 우선 |

## 6. 단계별 권고
1. **현 단계:** 소스와 교육자료 기반 도메인 계약 초안 작성, 원본 Git SHA 보존, 미확인 사항과 테스트 관점 문서화.
2. **차기 설계:** 실제 인명/의료코드 없이 합성 환자·직원 매핑 2~4건, 연관 링크 2~3건의 **읽기 전용 예제** 제작 → 참조 무결성 설계 검토.
3. **승인 후 구현:** 한정된 read-only adapter. 양 앱간 처방 복사·자동 재인증·자동 수행 처리 금지.
4. **장기 옵션:** 인증/역할/감사·저장 및 환자 중심 전역 ID/통합 운영은 별도 데이터 보호·임상·사용자 승인 후.

## 7. 참고
- PRN 내부 통합 설계 문서: 위 링크(2026-10-10 v0.3).
- 기존 MICU 연계 검토: [INTEGRATION_FEASIBILITY](../docs/INTEGRATION_FEASIBILITY.md).
- HL7. (2019). *MedicationRequest—FHIR R4*. https://hl7.org/fhir/R4/medicationrequest.html
- HL7. (2019). *ServiceRequest—FHIR R4*. https://hl7.org/fhir/R4/servicerequest.html
  - 이들은 **개념 분류 참고**이며 FHIR 적합성·nU 호환성을 증명하지 않는다.
