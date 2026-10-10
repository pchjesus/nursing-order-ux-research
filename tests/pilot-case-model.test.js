"use strict";
const assert = require("node:assert/strict");
const D = require("../app/domain.js");
const pilot = require("../research/pilot-case-model.cjs");
const F = pilot.loadSyntheticFixtures();
const copy = value => JSON.stringify(value);
let passed = 0;
function test(name, fn) { fn(); passed++; console.log("PASS PILOT", name); }

test("uses only real synthetic ACT candidates and no official nU codes", () => {
  const x = pilot.buildPilot(F, D);
  assert.equal(x.version, "0.1");
  assert.ok(F.catalog.some(e => e.code === x.search.expectedCode && e.type === "ACT"));
  assert.equal(D.search(F, x.search.expectedCode, "").length, 1);
  assert.ok(x.search.comparisonCodes.every(code => D.search(F, x.search.query, "").some(e => e.code === code)));
});
test("independent pilot cannot mutate source catalog or base fixture", () => {
  const before = copy(F);
  const x = pilot.buildPilot(F, D);
  x.state.orders[0].note = "changed only in pilot";
  assert.equal(copy(F), before);
  assert.ok(!F.catalog.some(x => x.code.startsWith("PILOT-")));
});
test("same activity code is two separate orders, not merged", () => {
  const x = pilot.buildPilot(F, D);
  const groups = D.groupPatientOrders(F, x.state, "P-A101");
  assert.equal(groups.length, 1);
  assert.equal(groups[0].items.length, 2);
  assert.equal(new Set(groups[0].items.map(i => i.order.id)).size, 2);
  assert.notEqual(groups[0].items[0].order.schedule.kind, groups[0].items[1].order.schedule.kind);
});
test("different patient never inherits pilot prescriptions or execution", () => {
  const x = pilot.buildPilot(F, D);
  const other = D.groupPatientOrders(F, x.state, "P-B102");
  assert.equal(other.length, 1);
  assert.ok(other[0].items.every(y => y.order.patientId === "P-B102"));
  assert.equal(D.summary(x.state, "P-B102").executions, 0);
});
test("three planned slots, one simulated execution, zero records are distinct", () => {
  const x = pilot.buildPilot(F, D);
  const group = D.groupPatientOrders(F, x.state, "P-A101");
  assert.equal(group[0].items.length, 2);
  const order = x.state.orders.find(o => o.id === x.scenario.scheduledOrderId);
  const overview = D.scheduleOverview(x.state, order);
  assert.equal(overview.planned, 3);
  assert.equal(overview.slots.reduce((n,s) => n+s.executions.length, 0), 1);
  assert.equal(overview.slots.reduce((n,s) => n+s.records.length, 0), 0);
  assert.equal(D.summary(x.state, "P-A101").records, 0);
});
test("conditional planned count is unknown not zero", () => {
  const x = pilot.buildPilot(F, D);
  const order = x.state.orders.find(o => o.id === x.scenario.conditionalOrderId);
  assert.equal(D.scheduleOverview(x.state,order).planned, null);
  assert.equal(D.summary(x.state,"P-A101").unknownPlans,1);
});
test("cross-patient/incorrect-slot corruption is rejected without modifying input", () => {
  const x = pilot.buildPilot(F, D), saved = copy(x.state);
  const broken = D.clone(x.state);
  broken.executions[0].patientId = "P-B102";
  assert.throws(() => D.validate(F,broken),/환자/);
  const badSlot = D.clone(x.state);
  badSlot.executions[0].slotId = "PILOT-O-001-S001";
  assert.throws(() => D.validate(F,badSlot),/예정|참조/);
  assert.equal(copy(x.state), saved);
});
test("summary output contains no patient name, logins, PIN or writable state", () => {
  const x = pilot.buildPilot(F, D);
  const view = pilot.summaryForReview(x);
  assert.deepEqual(Object.keys(view), ["version","warning","search","scenario"]);
  assert.ok(!JSON.stringify(view).includes('"pin"'));
  assert.ok(!JSON.stringify(view).includes('"orders"'));
  assert.equal("state" in view, false);
});
console.log("PILOT CASE MODEL:", passed, "PASSED");
