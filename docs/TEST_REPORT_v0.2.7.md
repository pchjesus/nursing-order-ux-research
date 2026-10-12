# v0.2.7 읽기 전용 합성 사례 뷰어 — 개발자 검사 보고

- 개발 기준: GitHub private/main `c3f8878de73bc0dd7c74dc220aae35211eeb541b` (v0.2.6 앱 및 화면 캡처 스크립트).
- 앱 자체는 v0.2.6으로 유지. 신규 연구 전용 `research/pilot-viewer.html` 및 분리된 렌더/모델 JS/CSS만 추가.
- 기존 테스트 기준: Node **116건**, Chromium **7개 브라우저 시나리오**.
- 신규 검증 정의: Node `tests/pilot-viewer.test.js` **12개**, Chromium `tests/pilot_viewer_browser.py` **1개**.
- CI에서 브라우저 렌더 PNG를 `nursing-pilot-review-v0.2.7` artifact로 업로드하도록 구성.

## 실제 검사 결과

- **개발/시험 코드 커밋:** `0d0db5f400d4dbbb4a666204b54818dc8ec1d481`.
- **원격 GitHub Actions:** [38189479202](https://github.com/pchjesus/nursing-order-ux-research/actions/runs/38189479202), `unit`·`browser` 모두 성공으로 확인.
- **Node 128/128 통과:** 기존 116개 + 신규 `PILOT VIEWER MODEL 12 PASSED`. 기존 `pilot-case-model.cjs`의 전체 합성 state와 새 브라우저 모델의 JSON-객체 일치, 유사코드 검색, 3/1/0 건수, 조건부 null, 환자 분리, 원본 불변과 localStorage 미사용 점검 포함.
- **Chromium 8/8 통과:** 기존 7개 + `pilot_viewer_browser.py` 신규 1개. GitHub Actions의 Chromium에서 **실제 `file://` HTML 열기**, 검색 42건/정확 코드 1건, 그룹화 전후 ID 불변, 환자 전환, localStorage 접근 시 예외를 발생시키도록 차단한 뒤 재로드, 페이지 오류 0건을 확인.
- **실제 캡처 증거:** CI artifact `nursing-pilot-review-v0.2.7` (ID `11721560519`)의 `ui-pilot-v0.2.7.png`. 브라우저가 렌더링한 화면이고 AI 생성 목업이 아님.
- **발견된 실행 버그:** 이번 CI에서 재현된 신규 실행 오류 없음. 브라우저 화면·코드의 정확성은 검증했으나 사람이 업무에서 더 정확히/빠르게 이용한다는 뜻은 아님.
- **검증된 보호:** 이전 7개 Chromium 회귀 시나리오 통과 및 기존 116개 Node 테스트 전부 통과. 새 파일럿은 별도 페이지로, 원본 `app/`·`data/` 코드를 변경하지 않아 현재 합성 저장·복원 체계를 유지함. 브라우저 테스트는 read-only 저장소 접근 차단까지 확인.

## 보호 및 미검증

- 변경 금지: `app/` 전체, `data/` 전체, 기존 Node 연구 파일럿 모델, 기존 환자/제품/직원 ID, 기존 인증·처방·기록 도메인, 저장 schema 2 및 localStorage `nursing-order-demo-v02`.
- 이전과 달리 B/C/D는 독립된 *연구 뷰어*에서 조회 가능. 기존 간호처방 메인 UI가 파일럿 상태를 불러오거나 저장하는 것은 아님.
- 읽기 전용 UI는 합성 자료를 메모리에서 생성하며 실환자정보, 실제 병원 내부자료 또는 참가자 답변을 다루지 않는다.
- 실제 간호사/사용자 사용성 시험, 비교 실험, 임상적 유용성/권한 및 nU 기존 기능 검증은 **실시하지 않았다**.
