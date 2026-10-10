"use strict";
/*
 * Independent read-only usability pilot model.
 * Synthetic cases only. Not an EMR adapter, clinical workflow, or evidence of usability.
 */
const path = require("node:path");
const fs = require("node:fs");
const vm = require("node:vm");

const PILOT_VERSION = "0.1";
const ACT_CODE = "SIM-ACT-0053";
const PATIENT_A = "P-A101";
const PATIENT_B = "P-B102";

function assert(condition, message) {
  if (!condition) throw Error("가상 평가 사례 오류: " + message);
}
function order(id, patientId, code, schedule, note, createdAt, actor) {
  return {
    id, patientId, code, status: "confirmed", orderedBy: actor,
    checkedBy: actor, createdAt, confirmedAt: createdAt,
    shift: "D", note, ...(schedule ? {schedule} : {})
  };
}
function buildPilot(fixtures, domain) {
  assert(fixtures && domain, "확장 가상 목록과 도메인 모델이 필요합니다.");
  assert(fixtures.catalog.some(x => x.code === ACT_CODE && x.type === "ACT"), "대상 ACT 없음");
  assert(fixtures.patients.some(x => x.id === PATIENT_A) && fixtures.patients.some(x => x.id === PATIENT_B), "가상 환자 없음");
  const actor = fixtures.users.find(x => x.shift === "D");
  assert(actor, "가상 근무조 없음");

  const conditional = domain.buildSchedule({
    kind: "conditional", condition: "가상 조건 발생 시만 평가", 
  }, "PILOT-O-001");
  const interval = domain.buildSchedule({
    kind: "interval", startAt: "2026-10-11T01:00:00.000Z",
    everyHours: 8, count: 3
  }, "PILOT-O-002");

  // The same code is not evidence that these two independent orders
  // have the same conditions, schedule, completion, or clinical equivalence.
  const state = {
    schema: 2,
    orders: [
      order("PILOT-O-001", PATIENT_A, ACT_CODE, conditional,
        "가상 조건부 처방", "2026-10-10T01:00:00.000Z", actor.id),
      order("PILOT-O-002", PATIENT_A, ACT_CODE, interval,
        "가상 3개 예정 시점", "2026-10-10T02:00:00.000Z", actor.id),
      order("PILOT-O-003", PATIENT_B, "SIM-ACT-0052", null,
        "다른 환자의 별도 가상 처방", "2026-10-10T03:00:00.000Z", actor.id)
    ],
    executions: [{
      id: "PILOT-E-001", patientId: PATIENT_A, orderId: "PILOT-O-002",
      by: actor.id, at: "2026-10-11T01:10:00.000Z",
      slotId: "PILOT-O-002-S001", note: "모의 수행 사건, 실제 간호행위 아님"
    }],
    records: [],
    links: [],
    audit: []
  };
  domain.validate(fixtures, state);
  const search = domain.search(fixtures, "드레싱", "");
  const exact = domain.search(fixtures, ACT_CODE, "");
  const similar = ["SIM-ACT-0052", ACT_CODE, "SIM-ACT-0054"];
  assert(similar.every(code => search.some(x => x.code === code)), "검색 후보 누락");
  assert(exact.length === 1 && exact[0].code === ACT_CODE, "정확 코드 검색 불일치");

  const grouped = domain.groupPatientOrders(fixtures, state, PATIENT_A);
  assert(grouped.length === 1 && grouped[0].items.length === 2, "환자 A 그룹 오류");
  const separate = domain.groupPatientOrders(fixtures, state, PATIENT_B);
  assert(separate.length === 1 && separate[0].items.length === 1, "환자 B 분리 오류");
  const scheduled = domain.scheduleOverview(state, state.orders[1]);
  const conditionalView = domain.scheduleOverview(state, state.orders[0]);
  const a = domain.summary(state, PATIENT_A);
  assert(scheduled.planned === 3 && scheduled.slots[0].executions.length === 1, "예정·수행 관계 오류");
  assert(conditionalView.planned === null, "조건부 예정은 개수 미정이어야 함");
  assert(a.orders === 2 && a.executions === 1 && a.records === 0, "건수 분리 오류");

  return {
    version: PILOT_VERSION,
    warning: "합성자료 전용. 처방 선택의 임상적 정답 또는 실제 수행·기록 누락을 판정하지 않습니다.",
    search: {
      prompt: "가상 목록에서 정확한 명칭 '멸균 창상 드레싱 관리'를 찾고 가상 코드를 확인합니다.",
      query: "드레싱",
      expectedCode: ACT_CODE,
      comparisonCodes: similar,
      matchedCandidates: search.length,
      exactCodeResults: exact.length
    },
    scenario: {
      patientId: PATIENT_A,
      otherPatientId: PATIENT_B,
      sameCodeOrderIds: ["PILOT-O-001", "PILOT-O-002"],
      conditionalOrderId: "PILOT-O-001",
      scheduledOrderId: "PILOT-O-002",
      otherPatientOrderId: "PILOT-O-003",
      plannedSlots: 3,
      conditionalPlanned: null,
      simulatedExecutions: 1,
      linkedNursingRecords: 0,
      unassigned: scheduled.unassigned
    },
    state
  };
}
function loadSyntheticFixtures() {
  // Loaded only for local non-clinical CLI output. No user files or storage accessed.
  const context = {globalThis: {}};
  const source = fs.readFileSync(path.join(__dirname, "..", "app", "fixtures.js"), "utf8");
  vm.runInNewContext(source, context);
  const base = JSON.parse(JSON.stringify(context.globalThis.DEMO_FIXTURES));
  return require("../app/activity-details.js").expandFixtures(base);
}
function summaryForReview(pilot) {
  // Do not expose internal state or counts as real-world performance metrics.
  return {
    version: pilot.version, warning: pilot.warning,
    search: pilot.search, scenario: pilot.scenario
  };
}
module.exports = {buildPilot, loadSyntheticFixtures, summaryForReview, PILOT_VERSION};
if (require.main === module) {
  const D = require("../app/domain.js");
  const pilot = buildPilot(loadSyntheticFixtures(), D);
  process.stdout.write(JSON.stringify(summaryForReview(pilot), null, 2) + "\n");
}
