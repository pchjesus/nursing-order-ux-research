# v0.2.6 — 자동검사 검증 기록

작성: 2026-10-10 · 합성 자료 전용, 실제 nU/임상 사용자 검증 아님.

- 시작 최신 `main`: `a2ffa8f2824f87351f0a0b2f4a066a4af6faf66a`.
- 시작 시 기존 검사: **94 Node** (기존 86 + 합성 사용성 파일럿 8), **6 Chromium DOM 시나리오**.
- 신규: `tests/slot-status.test.js` 상태전이·PIN·환자별 격리·audit·원본 시각 보존·직렬화 및 손상 데이터 거부, `tests/slot_status_browser.py` 브라우저 상태 변경/조회 시나리오. 기존 문구·버전 기대값을 최신 UI에 맞춤.
- 자동실행 경로: `.github/workflows/synthetic-regression.yml` 기존 전수 검사(루프에 새 파일 자동 포함).

## 실제 GitHub Actions 검증 결과

- **코드 및 테스트 최종 확인 커밋:** `208e6d16cddae7ddce4338f76be86044eea898e6`.
- [GitHub Actions 실행 38051047068](https://github.com/pchjesus/nursing-order-ux-research/actions/runs/38051047068): `unit` 성공 + `browser` 성공. 두 작업 모두 실제 완료 확인.
- **Node 단위검사 116/116 통과:** 기존 94개(활동 상세 19, 도메인 15, 그룹 8, 처방지 17, 파일럿 8, 대표 용어 9, 예정 18)와 신규 슬롯 상태 변경 22개.
- **Chromium DOM 주입형 브라우저 시나리오 7/7 통과:** 기존 6개 + 신규 `slot_status_browser.py` 1개. 신규 검사에는 보류/재개/연기/취소, PIN 오류/정상 처리, 원본 시각 및 audit, 환자별 분리, 가상 저장·복원, 미처리 JS 오류 0개 확인 포함.
- 첫 Actions 검사 `38050949446`에서 단위검사는 통과했지만 기존 일정 브라우저 검사의 문구 기대값이 변경된 UI 문구(`연결 모의 수행`)와 달라 실패. `tests/scheduling_browser.py`의 단언만 최신 문구로 정정. 최종 재실행에서 7개 모두 통과. **기존 데이터 손상이나 앱 도메인 버그가 재현된 것은 아님.**
- GitHub Actions는 헤드리스 Chromium과 **메모리 대체 localStorage**를 사용함. 실제 사용자 PC의 디스크 지속성/모바일 작동이나 사용성 및 임상적 안전성을 입증하는 검사는 아님.

## 보존 기준
- `data/CATALOG.*`, `app/fixtures.js`, `app/activity-details.js`, `app/case-context.js`, `research/` 파일 변경 없음.
- 기존 ACT 42, 315개 후보(ACT 214/FOLLOW 42/MAT 59), 4명 환자, 시드 16건, 기존 제품 18개 ID와 원본 히스토리 보호.
- 저장 스키마 2, localStorage 키 `nursing-order-demo-v02`, 그룹 UI, 검색, 기존 확정/PIN 및 수행·기록 링크 보존.
- 실제 사용성 시험, 임상 권한/상태 정책 검증, 실사용 브라우저 디스크 영속성, DST/타임존 정책 검증은 범위 밖.
