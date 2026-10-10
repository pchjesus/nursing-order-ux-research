# 공통 신원/처방 연관 ID 계약 초안 — 설계 전용
작성: 2026-10-10 · 상태: **제안**, 개발/데이터 이관 미승인, 실제 FHIR 구현 아님

## 1. 현재 시스템 간 ID 불일치
| 개념 | 간호처방 v0.2.1 | PRN v0.3 | MICU v0.7.4 | 권고 |
|---|---|---|---|---|
| 환자 | `P-A101` 등 | `DEMO-P001` 등 | 환자 레지스트리 없음 | `shared_patient_id`와 각 원본 `local_patient_id` 별도 매핑 |
| 직원 | `N-D01` 등 | 가상 의사 `prescriber_id`, 간호사 `nurse_id` | `source:<rosterId>:<index>`, 추가 인원 ID | `shared_staff_id`와 `local_staff_id`; 인증 확인과 분리 |
| 의사 주문 | 없음 | `order_id`, `createEnvelope().request_id` | 없음 | PRN 원본 ID 유지, 소스/도메인 추가 |
| 간호 주문 | `order.id`, `code` | 아직 없음 | 없음 | 간호 개별 주문 ID/합성 후보코드 분리 |
| 수행/기록 | `execution.id`, `record.id`, `links` | 읽음확인 별도 `event_id` | 수정 이력 별도 | 수행, 간호기록, 읽음확인을 각각 구분 |
| 근무 | `shift=D/E/N` 고정 데모 | 가상 근무 시간과 읽음확인 | 근무표/날짜/시프트 컨텍스트 | 근무정보는 사실 스냅샷, 로그인 증명 불가 |

`SIM-ACT-0053`은 **간호활동 후보 코드**이며, `DEMO-O-001`은 **개별 가상 간호처방 ID**이다. 이 둘을 공통 처방 ID로 대체하면 안 됨.

## 2. 최소 공통 엔터티 — 향후 제안
1. `PatientIdentity`: `shared_patient_id` (새 가상 ID), `simulation_only=true`. 실제 환자 식별자와 매핑 금지.
2. `PatientAlias`: `source_system`, `source_patient_id`, `shared_patient_id`, `mapping_status`, `mapping_basis`, `verified_at`. **동일인 추정 금지**.
3. `StaffIdentity` / `StaffAlias`: 동일 구조이나 `role`과 `authenticated_session_id`를 구분. MICU 행 ID는 단기 참조로만 사용.
4. `OrderEnvelope`: `request_id`, `source_system`, `source_order_id`, `patient_id`, `domain`, `priority`, `mode`, `status`, `created_at`, `provenance`.
5. `NursingOrder`: 기존 `order.id`를 보존하고 간호활동 코드, `orderedBy`/ `checkedBy`, 상태를 명확히 구분. 임상 사용 권한은 미확인.
6. `OrderRelation`: `relation_id`, `nursing_order_id`, `related_request_id` (**optional**), `relation_type`, `patient_mapping_status`, `source`, `confirmed_by`. 원본 주문을 덮어쓰지 않는다.
7. `NursingExecution` / `NursingDocument` / `ExecutionDocumentLink`: 기존 분리 구조를 유지. 실행과 기록을 합치거나 PRN '읽음확인'과 합산하지 않음.
8. `ClinicalServiceRequest`(검사·시술·처치 요청), `Specimen`(검체), `Container`(용기), `Material`(소모품), `NursingActivity`: 명칭이 관련되어도 객체 유형을 구분.

## 3. 연관 처방 링크의 선택성과 검증 규칙
- `related_request_id=null`은 정상적인 합성 독립 간호활동에 허용. 모든 ACT/FOLLOW를 의사 처방으로 연결하지 않음.
- `relation_type`은 설계상 `based_on`(요청 근거 있음), `associated_with`(관련 정보), `fulfills`(업무 수행) 등을 후보로 두되 **임상 규칙/권한 승인 전 사용 의미를 확정하지 않음**.
- 동일 환자라도 복수 주문/다른 상태/서로 다른 시간 또는 조건이 존재할 수 있음. 링크는 의도적으로 지정한 개별 주문에만 설정한다.
- 합성 환자 ID 매핑의 검증 상태가 `verified`가 아니면 자동 링크 생성 금지.
- 주문 출처의 원본이 없는 경우(특히 PRN v0.3 탭 메모리 소실) 연결 결과는 **검증 불가**로 표시해야 하며, 보존된 것처럼 표현하지 않음.
- 직원 이름, 근무조, MICU 원본 행 번호를 처방 작성자 또는 현재 로그인 간호사 증거로 사용 금지.
- 작성자(의사/간호사)·확인자(동일 계정 PIN 재인증)·열람 확인자·실제 수행자·기록자는 각각 다른 감사 동작이다.

## 4. 읽기 전용 합성 예제 (구현 불필요)
```json
{
  "schema_version": "convergence-draft-1",
  "simulation_only": true,
  "patients": [
    {
      "shared_patient_id": "SIM-PAT-0001",
      "aliases": [
        {"source_system": "prn", "source_patient_id": "DEMO-P001", "mapping_status": "proposed"},
        {"source_system": "nursing", "source_patient_id": "P-A101", "mapping_status": "proposed"}
      ]
    }
  ],
  "nursing_order_link": {
    "source_system": "nursing",
    "source_order_id": "DEMO-O-001",
    "related_request_id": null,
    "relation_type": null,
    "link_status": "not_linked"
  }
}
```
**위 환자 매핑은 구조를 설명하기 위한 가상 *제안*이며, 두 앱의 환자가 실제로 동일하다고 검증하거나 저장한 사실이 아니다.** 추후 실험에서 동일인으로 설정하려면 별도의 합성 시나리오 정의와 사용자 승인이 필요하다.

## 5. 기술적 최소 이행 순서
- **현재:** 위 계약은 **Markdown 문서로만 존재**. 앱 스키마 2, localStorage 키, PRN 탭 메모리, MICU IndexedDB v4, 기존 저장된 개별 ID는 변경하지 않음.
- **다음 단계(설계):** 별도 스냅샷 JSON/연결표 샘플의 필수 필드, 타입/버전/중복/거부 사유 정의. 개인정보·학생 실습 파일 내 환자·직원 정보의 자동 복사 금지.
- **구현 직전:** 기존 가상 ID와 신규 공통 ID 사이 1:1·다대1 충돌/삭제/새로고침/중복 연결/동시 변경 반례를 시험 계획으로 작성.
- **실제 연동 이후:** 서버 인증·권한·정정·개인정보 처리·서명·임상기관 승인 논의 필요.

## 6. 앞으로의 관련 필드 중 필수·선택 권고
| 원본 객체 | 지금 유지할 필드 | 미래에 **선택적으로** 추가 고려 | 금지 |
|---|---|---|---|
| 간호 `order_instance` | `id,patientId,code,orderedBy,checkedBy` 등 | 외부 조회용 `linked_request_refs[]` 또는 별도 링크 테이블 | 기존 ID 재발급, 모든 간호행위에 의사처방 ID 강제 |
| 간호 실행 | `id,orderId,patientId,by,at` | 별도 연관 주문 링크를 통한 간접 참조 | 의사 PRN 주문을 자동으로 시행됨 처리 |
| 간호기록 | `id,orderId,patientId,by,at,revision` | 기록 맥락 / 출처 표시 | 원본 이력 덮어쓰기 |
| `catalog_item` | `SIM-ACT*` / `FOLLOW` / `MAT` | 별도 `display_category`, `entity_kind`, `source_keys` | 전체 카테고리 일괄 약물/처치로 변환 |

## 7. 참고
- [통합 영향 분석](THREE_PROJECT_CONVERGENCE_IMPACT.md)
- [학교 자료와 Order Manage 필드 구조 매핑](../research/PRACTICUM_REFERENCE_MAPPING.md)
- PRN `docs/THREE-PROJECT-CONVERGENCE-v0.3.md`의 `OrderEnvelope` 구상과 맞추되 **정식 데이터 계약 확정 전**.
