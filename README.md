# 간호처방 검색·수행·기록 UI/UX 개선 프로젝트

> **상태:** 초기 자료 v0.1 / A–C–C 설계 방향 승인 및 요구사항·업무 시나리오 v0.2. **실제 간호정보시스템 아님**. 프로토타입 미구현.

## 프로젝트 목표
간호사가 필요한 간호 관련 처방·중재를 정확하게 탐색하고 유사 항목을 구분하며, 처방 이후의 수행·기록·조회 상태를 서로 혼동하지 않고 확인할 수 있는 UI/UX를 연구합니다. 실제 CMC nU 시스템을 재현한 프로젝트가 아니며 연동하거나 임상적으로 사용하지 않습니다.

## 현재 확인된 것 / 확인되지 않은 것
- **공개 사실:** 간호중재 분류 NIC, ICNP/SNOMED CT 간호 용어, 간호술 교과서의 범주, WHO·CDC 지침과 안전 설계 참고문헌 존재
- **프로젝트 작성:** 실무 관련 개념을 폭넓게 탐색할 목적으로 만든 **가상 데이터 315개(24개 후보 카테고리)**. NIC의 공식 315개 항목이나 실제 nU 처방 목록 아님
- **미확인:** 서울성모병원 nU의 간호처방명과 코드, 실제 등록 권한, 각 항목별 처방 가능 여부, 기관 규칙, 실무상 과제 우선순위

## 데이터 유형을 반드시 구분
1. `ACT`: 간호활동·간호중재 후보
2. `FOLLOW`: 의료진 처방 등에 연계될 수 있는 수행 후보
3. `MAT`: 소모품·장비 예시. **간호처방과 동일한 항목 유형으로 취급 금지**

모든 코드는 `SIM-`으로 시작하는 가상 코드입니다. 공식 NIC/ICNP/SNOMED/EDI/nU 코드가 아닙니다. 모든 항목은 임상 검증 전이며, 표준 명칭이나 실제 청구 코드를 확인했다고 표시하지 않았습니다. 등록/수행 권한은 확인 전까지 **미확인**으로 취급합니다.

## 저장소 구성
- [`data/CATALOG.csv`](data/CATALOG.csv): 전체 항목과 가상 코드, 유형, 후보 분류, 임상 검증 상태를 담은 데이터
- [`data/CATALOG.md`](data/CATALOG.md): 분류별 전체 목록 읽기 버전
- [`data/CATALOG.json`](data/CATALOG.json): 동일 데이터의 구조화 버전
- [`data/STATS.json`](data/STATS.json): 자동 집계 요약
- [`research/SOURCES.md`](research/SOURCES.md): 공식 출처, 용도, 한계 및 APA 7판 참고문헌
- [`design/INFORMATION_ARCHITECTURE.md`](design/INFORMATION_ARCHITECTURE.md): 처방 전·후 정보 구조, 구분해야 할 개념
- [`design/REQUIREMENTS.md`](design/REQUIREMENTS.md): 승인된 기획 방향, 상세 요구사항, 모의 수용 기준
- [`design/WORKFLOW_SCENARIOS.md`](design/WORKFLOW_SCENARIOS.md): 처방 전후 연결 업무 시나리오, 예외 및 평가 과제
- [`design/ROADMAP.md`](design/ROADMAP.md): 위험·검증·진입 조건을 포함한 로드맵
- [`design/OPEN_DECISIONS.md`](design/OPEN_DECISIONS.md): 승인된 A–C–C 및 남은 UX 선택지
- [`docs/VALIDATION_CASES.md`](docs/VALIDATION_CASES.md): MVP 전부터 보존할 안전 검증 시나리오
- [`docs/REPOSITORY_SETUP.md`](docs/REPOSITORY_SETUP.md): private GitHub 저장소 준비 및 푸시 가이드
- [`DEVLOG.md`](DEVLOG.md): 완료·미완료 기록

## 2026-10-10 승인된 기획 방향
- **A:** 간호중재·간호행위(합성 `ACT`) 중심. `FOLLOW`/`MAT`를 원본에서 보존하고 유형을 혼동하지 않음.
- **C:** 처방 전 검색·선택과 처방 후 수행·기록 이력 조회를 연결하는 가상 MVP.
- **C:** 업무 단계별 상위 화면 + 임상 목적별 카테고리의 혼합형.
- **보류:** 실제 처방 가능 여부·권한/책임, 가상 선택 후 동작, 상태·그룹화 세칙, 구체적인 최종 UI.

## 다음 단계
1. 현직 간호사 또는 간호정보학 전문가와 간호처방 범위·권한·기록 관계 확인
2. ACT 214개 중 MVP 합성 사례 20~40개 선정 및 명칭·구별 속성 검토 (전체 315개 원본 보존)
3. [업무 시나리오](design/WORKFLOW_SCENARIOS.md) 기준 정적 와이어프레임 및 반례 비교
4. [미결정 사항](design/OPEN_DECISIONS.md) 중 핵심 UX를 사용자와 합의한 후 별도 구현 단계 진행

## 안전·지식재산 원칙
- 실환자 데이터, 병원 내부 비공개 화면·코드, 개인정보·계정정보를 저장하지 않습니다.
- 환자 상태나 실제 처방을 판단하는 데 사용하지 않습니다.
- 표준 분류 전체 목록을 무단 복제하지 않습니다. 표준 코드 매핑을 추가하기 전 라이선스 확인이 필요합니다.
- 화면에서 유사 항목을 묶더라도 원본 처방, 수행 사건, 기록의 독립성과 이력은 유지해야 합니다.
- UI 디자인·개발 기술스택·실제 상태 전이는 **아직 확정하지 않았습니다**.

## 개발 기본 원칙
프로젝트에 제공된 `AI-개발-운영-가이드-Light`, `AI-Assisted-Software-Development-Skill-v1.4-Light`와 기존 프로젝트 지침을 상위 운영 원칙으로 적용하며, 내용을 이 저장소에 무단으로 복제하지 않습니다.
