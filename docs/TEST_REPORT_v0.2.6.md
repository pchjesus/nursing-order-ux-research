# v0.2.6 — 자동검사 검증 기록

작성: 2026-10-10 · 합성 자료 전용, 실제 nU/임상 사용자 검증 아님.

- 시작 최신 `main`: `a2ffa8f2824f87351f0a0b2f4a066a4af6faf66a`.
- 시작 시 기존 검사: **94 Node** (기존 86 + 합성 사용성 파일럿 8), **6 Chromium DOM 시나리오**.
- 신규: `tests/slot-status.test.js` 상태전이·PIN·환자별 격리·audit·원본 시각 보존·직렬화 및 손상 데이터 거부, `tests/slot_status_browser.py` 브라우저 상태 변경/조회 시나리오. 기존 문구·버전 기대값을 최신 UI에 맞춤.
- 자동실행 경로: `.github/workflows/synthetic-regression.yml` 기존 전수 검사(루프에 새 파일 자동 포함).

**상태:** 실제 GitHub Actions 실행/로그 확인 후 통과 건수 및 버그·미검증 사항을 기록한다. 이 시점에서는 새 검사 통과를 주장하지 않는다.

## 보존 기준
- `data/CATALOG.*`, `app/fixtures.js`, `app/activity-details.js`, `app/case-context.js`, `research/` 파일 변경 없음.
- 기존 ACT 42, 315개 후보(ACT 214/FOLLOW 42/MAT 59), 4명 환자, 시드 16건, 기존 제품 18개 ID와 원본 히스토리 보호.
- 저장 스키마 2, localStorage 키 `nursing-order-demo-v02`, 그룹 UI, 검색, 기존 확정/PIN 및 수행·기록 링크 보존.
- 실제 사용성 시험, 임상 권한/상태 정책 검증, 실사용 브라우저 디스크 영속성, DST/타임존 정책 검증은 범위 밖.
