# v0.2.7 읽기 전용 합성 사례 뷰어 — 개발자 검사 보고

- 개발 기준: GitHub private/main `c3f8878de73bc0dd7c74dc220aae35211eeb541b` (v0.2.6 앱 및 화면 캡처 스크립트).
- 앱 자체는 v0.2.6으로 유지. 신규 연구 전용 `research/pilot-viewer.html` 및 분리된 렌더/모델 JS/CSS만 추가.
- 기존 테스트 기준: Node **116건**, Chromium **7개 브라우저 시나리오**.
- 신규 검증 정의: Node `tests/pilot-viewer.test.js` **12개**, Chromium `tests/pilot_viewer_browser.py` **1개**.
- CI에서 브라우저 렌더 PNG를 `nursing-pilot-review-v0.2.7` artifact로 업로드하도록 구성.

## 실제 검사 결과

원격 GitHub Actions 실행 결과 확인 후 통과/실패, 수정 사항, 남은 검증 항목을 여기에 기입한다. **작성 단계에서는 아직 신규 코드의 테스트 통과를 주장하지 않는다.**

## 보호 및 미검증

- 변경 금지: `app/` 전체, `data/` 전체, 기존 Node 연구 파일럿 모델, 기존 환자/제품/직원 ID, 기존 인증·처방·기록 도메인, 저장 schema 2 및 localStorage `nursing-order-demo-v02`.
- 이전과 달리 B/C/D는 독립된 *연구 뷰어*에서 조회 가능. 기존 간호처방 메인 UI가 파일럿 상태를 불러오거나 저장하는 것은 아님.
- 읽기 전용 UI는 합성 자료를 메모리에서 생성하며 실환자정보, 실제 병원 내부자료 또는 참가자 답변을 다루지 않는다.
- 실제 간호사/사용자 사용성 시험, 비교 실험, 임상적 유용성/권한 및 nU 기존 기능 검증은 **실시하지 않았다**.
