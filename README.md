# 간호처방 검색·수행·기록 UI/UX 개선 프로젝트

> **상태:** 합성 데이터 기반 **기능형 MVP v0.2.1 구현** / 임상 검증 전. **실제 간호정보시스템·CMC nU 아님**.

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

## 기능형 시뮬레이터 v0.2 실행
1. [**app/index.html**](app/index.html)을 내려받아 같은 `app/` 폴더에 있는 JS/CSS 파일들과 함께 브라우저로 엽니다. 별도 패키지 설치는 필요 없습니다.
2. 파일로 열 때 저장소 접근 정책 문제가 발생하면 `python -m http.server 8000` 실행 후 `http://localhost:8000/app/`로 엽니다.
3. 왼쪽에서 **가상 근무조 D/E/N**과 가상 간호사 계정을 고르고, 화면에 표시된 데모 비밀번호로 로그인합니다.
4. **가상 환자 4명** 중 한 명을 선택하고 **ACT 38개**에서 검색/분류 후 간호활동을 **임시저장**합니다.
5. **처방·수행·기록 현황**에서 동일 계정 비밀번호를 다시 입력하면 **가상 처방**으로 확정됩니다. 이후 모의 수행과 모의 기록을 각기 별도 사건으로 추가합니다.
6. 저장소는 **현재 브라우저의 localStorage**에만 남습니다. '초기화'는 기록을 삭제하므로 확인 후 사용하세요.

**보안·임상 주의:** 화면에 표시된 PIN은 실사용 인증정보가 아니라 교육용 고정값입니다. '비밀번호 재입력'은 **같은 사람의 재인증 시연이며 다른 간호사의 독립적 이중확인이 아닙니다.** 근무조는 선택된 모의 조건으로, 실제 병원 로그인/근무표와 연결되지 않습니다. 실환자, 병원 내부 코드, 실제 nU 화면은 사용하지 않았습니다.

**구조:** `app/fixtures.js` 합성 데이터, `app/domain.js` 데이터·권한 시뮬레이션 및 상태 전이, `app/app.js` 교체 가능한 UI 이벤트, `app/styles.css` 스타일. 따라서 후속 UI 개편이 가능하도록 도메인 동작을 화면에서 분리했습니다.

**검증:** `node tests/domain.test.js` 15개 통과. Playwright 브라우저 조작 시나리오 1개 통과(테스트 환경 정책상 HTML/CSS/JS를 별도 문서에 삽입하는 방식). [상세 테스트 보고](docs/TEST_REPORT.md) · [ACT 38개 선정 목록](docs/SELECTION.md).

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
- [`app/index.html`](app/index.html): 합성 기능형 MVP (v0.2)
- [`app/domain.js`](app/domain.js): UI에서 분리한 상태·검증·처방 로직
- [`app/fixtures.js`](app/fixtures.js): 합성 환자/간호사/처방 데이터
- [`docs/SELECTION.md`](docs/SELECTION.md): 38개 ACT 후보 선정 명세
- [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md): 실제 수행한 시험과 미검증 사항
- [`tests/domain.test.js`](tests/domain.test.js): 도메인 단위 테스트
- [`tests/browser_smoke.py`](tests/browser_smoke.py): Playwright 상호작용 검사
- [`DEVLOG.md`](DEVLOG.md): 완료·미완료 기록

## 2026-10-10 승인된 기획 방향
- **A:** 간호중재·간호행위(합성 `ACT`) 중심. `FOLLOW`/`MAT`를 원본에서 보존하고 유형을 혼동하지 않음.
- **C:** 처방 전 검색·선택과 처방 후 수행·기록 이력 조회를 연결하는 가상 MVP.
- **C:** 업무 단계별 상위 화면 + 임상 목적별 카테고리의 혼합형.
- **보류:** 실제 처방 가능 여부·권한/책임, 가상 선택 후 동작, 상태·그룹화 세칙, 구체적인 최종 UI.

## 다음 단계
1. 기능형 v0.2 시뮬레이터에 대한 사용자 피드백과 실제 브라우저·기기에서 수동 동작 확인
2. 선택된 ACT 38개와 가상 환자 4명의 실제 업무 타당성은 **별도** 전문가 검토
3. [미결정 사항](design/OPEN_DECISIONS.md)을 기준으로 상태/그룹화·독립 2인 확인·역할·백엔드 도입의 필요성 검토
4. 사용자 요구에 맞춰 UI를 교체하되 도메인 로직/식별자/기록 연결 무결성 보호

## 안전·지식재산 원칙
- 실환자 데이터, 병원 내부 비공개 화면·코드, 개인정보·계정정보를 저장하지 않습니다.
- 환자 상태나 실제 처방을 판단하는 데 사용하지 않습니다.
- 표준 분류 전체 목록을 무단 복제하지 않습니다. 표준 코드 매핑을 추가하기 전 라이선스 확인이 필요합니다.
- 화면에서 유사 항목을 묶더라도 원본 처방, 수행 사건, 기록의 독립성과 이력은 유지해야 합니다.
- 이번 v0.2의 UI는 테스트용 임시 레이아웃으로, 요구사항에 따라 언제든지 변경할 수 있습니다. 실제 기관의 상태 전이·권한은 여전히 미검증입니다.

## 개발 기본 원칙
프로젝트에 제공된 `AI-개발-운영-가이드-Light`, `AI-Assisted-Software-Development-Skill-v1.4-Light`와 기존 프로젝트 지침을 상위 운영 원칙으로 적용하며, 내용을 이 저장소에 무단으로 복제하지 않습니다.

## v0.2.1 기능 개선 (2026-10-10)
- **기능 추가:** 처방·수행·기록 화면에서 '같은 가상코드 묶어 보기'를 선택하면 동일 가상 환자/코드의 개별 처방 2건 이상을 화면에서만 요약한다. 기본값은 **꺼짐**으로, 기존 개별 목록을 보존한다.
- 원본 주문 ID, 조건·메모, 처방자/확인자, 수행 사건, 관련 기록 및 감사 이력은 각각 펼쳐서 조회한다. 임상 동등성은 확인되지 않았으므로 개별 처방 데이터를 병합하지 않는다.
- 저장 스키마 `2` 및 로컬 키 `nursing-order-demo-v02`를 유지하며, 기존 합성 후보 315개/38개 선택 목록/가상 환자 4명/초기 처방 16건은 변경하지 않았다.
- **개발자 자동검사:** 기존 단위 15개 + 신규 그룹 단위 8개 통과, 기존·신규 Chromium 상호작용 시나리오 각 1개 통과. 사용자 사용성 시험은 MVP가 안정화된 뒤 진행.
- 실행: 동일하게 [app/index.html](app/index.html)에서 가능하며 재설치·데이터 재설정을 요구하지 않는다.
- [v0.2.1 테스트 보고](docs/TEST_REPORT_v0.2.1.md) · [MICU 통합 가능성 및 위험 검토](docs/INTEGRATION_FEASIBILITY.md)

### MICU 프로그램과의 관계
- 현재 검토 대상은 [MICU 화재대피 v0.7.4 RC](https://github.com/pchjesus/micu-fire-evacuation)이고 이전 `seoul-St.mary-micu-fire-evacuation` 저장소와 구별한다.
- **연동 기능 미구현.** 근무표는 MICU IndexedDB, 간호처방은 localStorage에 저장하며 실제 직원 ID·로그인·환자정보를 자동 연결하지 않는다.
- 권장 다음 단계: 합성 데이터로 읽기 전용 근무표 교환 계약을 검토하고 공통 직원 ID, 근무 유효성, 권한, 원본 데이터 보호를 먼저 정의한다.

## 2026-10-10 — PRN / MICU 장기 통합 대비 (설계 검토만)
- 장기적으로 세 프로젝트를 연결할 가능성을 확인했으며, **지금은 저장소 병합·공통 DB·마이그레이션·UI 전면 변경을 하지 않는다**.
- 의사 PRN 처방과 간호행위의 연결은 **명시적이고 선택적인 연관 주문 참조**로만 제안한다. 독립 `ACT` 간호행위를 의사 처방으로 재분류하지 않음.
- 각 앱의 환자/직원/처방/수행/기록 ID는 아직 서로 다른 ID 체계다. 환자 이름/병상/나이 유사성으로 같은 사람이라고 가정하지 않음.
- 향후 합성 환자·Kardex·Order Manage 형식에는 사용자 제공 학교 실습 자료의 **구조**를 참고한다. 실제 nU의 처방 화면이나 공식 업무 규칙으로 단정하지 않음.
- **[3개 프로젝트 통합 영향 분석](design/THREE_PROJECT_CONVERGENCE_IMPACT.md)** · **[공통 ID/연관 참조 계약 초안](design/SHARED_IDENTITY_LINK_DRAFT.md)** · **[실습자료 구조 참고표](research/PRACTICUM_REFERENCE_MAPPING.md)**
- 원본 교내 PDF, 환자/학생 이름·차트번호 또는 학교 평가 처방의 원문을 저장소에 업로드하지 않음. 모든 실제 데이터 연계 및 합성 사례 적용은 후속 사용자 승인 후.

### 같은 날 확인한 PRN v0.3.1 참고 사항
- PRN 저장소에 별도의 합성 **Kardex/Order Manage 조회**가 구현되었음을 확인했다. 간호처방 앱과 데이터/환자 ID는 아직 공유하지 않는다.
- 최신 확인 기준 및 영향: [THREE_PROJECT_CONVERGENCE_IMPACT](design/THREE_PROJECT_CONVERGENCE_IMPACT.md) 8절, [PRACTICUM_REFERENCE_MAPPING](research/PRACTICUM_REFERENCE_MAPPING.md) 6절.

## v0.2.2 (2026-10-10): 가상 Kardex · 간호처방지 화면 추가
- 사용자 결정: **PRN·MICU·간호처방 세 프로그램을 당분간 독립적으로 개발**한다. 이번 버전은 간호처방만 수정했으며 공통 ID 매핑·외부 의사 처방 링크·통합 DB·자동 동기화는 **미구현**이다.
- '처방·수행·기록 현황'에서 기본 닫힘의 **'가상 Kardex · 간호처방지 보기'**를 펼칠 수 있다. 4명 가상 환자별 인계 요약/관찰 초점을 별도 합성 자료로 작성했다.
- 학교 실습자료(워크리스트 12쪽, 사례기반 실무실습 17쪽)의 **사례→Kardex→Order Manage** 정보 구조만 참고하고 원문 환자/코드/개별 약물 용량은 복제하지 않았다.
- 간호활동 ACT만 처방지에서 조회하며, **활동 코드·개별 처방 ID·작성자·확인자·상태·작성시각·수행·기록 건수**를 별도 열로 나타낸다.
- 순수 조회 모델 `app/order-sheet-model.js`, 합성 사례 `app/case-context.js`를 UI와 분리했다. 기존 `app/domain.js`, `app/fixtures.js`, 스키마 2 및 `nursing-order-demo-v02` 키는 **변경 없음**.
- 기존 도메인 15/15, 그룹화 8/8, 신규 처방지 모델 17/17 단위검사 및 Chromium 주입형 상호작용 3/3 **통과**. 실제 localhost/browser 저장 복원·사용성·임상 검증은 아직 완료되지 않았다.
- 실행: 기존 [app/index.html](app/index.html). 자세히 보기: [설계 및 사용](docs/CASE_SHEET_v0.2.2.md), [테스트 보고](docs/TEST_REPORT_v0.2.2.md).
