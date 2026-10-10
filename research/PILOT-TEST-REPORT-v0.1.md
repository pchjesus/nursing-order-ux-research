# 합성 간호처방 사용성 파일럿 v0.1 — 실행 검증 기록

> 2026-10-10 · 독립형 합성 사례 준비 단계, 실제 간호사 대상 실험 아님

## 대상 커밋
- 파일럿 구현: `bf6ad633cedcf631773ae48d76a9ccd5464d96ba`.
- GitHub Actions [38037057746](https://github.com/pchjesus/nursing-order-ux-research/actions/runs/38037057746): `unit` 및 `browser` 모두 완료·성공.
- 실제 Node.js 22 로그: 기존 86건 + 신규 `PILOT CASE MODEL: 8 PASSED` = **총 94건 통과**. 로그에서 `DETAIL 19 / DOMAIN 15 / GROUPING 8 / ORDER SHEET 17 / PILOT 8 / REPRESENTATIVE 9 / SCHEDULING 18` 확인.
- 실제 Playwright/Chromium DOM 주입형 검사: **기존 6개 시나리오 모두 성공**. 브라우저 신규 파일럿 시나리오는 추가하지 않았다.
- GitHub 실행 결과는 코드/가상 데이터의 자동검증 근거이며, 실제 참가자 사용성·임상 유용성·실제 병원 시스템 비교는 **미실시**.

## 재현
```bash
node research/pilot-case-model.cjs
node tests/pilot-case-model.test.js
for f in tests/*.test.js; do node "$f"; done
```
- 첫 명령은 **읽기 전용 합성 연구 과제 요약**을 표준 출력(JSON)으로 표시한다. 파일 쓰기·사용자 기록 수집·저장소 마이그레이션이 없다.
- 실제 간호처방 웹앱 UI가 B/C/D 파일럿 상태를 로드한다는 뜻이 아니다.
- 두 번째/세 번째 명령은 합성 데이터 검색·그룹·환자 구분·예정/수행/기록 간 모델의 자동 일관성 검사다.

## 미실시
- 실제 간호사/전산 담당자 인터뷰, nU 업무 흐름·실제 코드 검증, 참가자 소요시간·정확도 평가.
- 실사용 UI 두 버전 비교, 파일럿 사례를 실제 브라우저에 주입한 화면 테스트, 의료기관 인증·환자안전 영향 검증.
- 정보 보안 관련 승인 없는 자료 수집 및 실제 개인정보 입력.

## 다음 연구 Gate
1. `research/USABILITY-PILOT-v0.1.md`와 `research/OBSERVATION-TEMPLATE-v0.1.md`를 바탕으로 실제 업무의 기존 기능/남은 문제를 확인.
2. 실무 근거가 확보되면 기존 MVP vs 비교 UI의 동일 합성 사례 평가 대안을 사용자에게 제시하고 승인 후 구현.
3. 기능이 중복되거나 추가 업무만 유발하면 새 UI 개발 대신 교육/검색 도움말/연구 종료를 검토.
