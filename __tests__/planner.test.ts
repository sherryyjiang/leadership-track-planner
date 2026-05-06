import { describe, expect, it } from "vitest";
import {
  createPlannerHistory,
  createDraftSession,
  getPlannerSnapshotSignature,
  getChangedSessionIds,
  getChangedSlotIds,
  getDeletedSessionIds,
  getGapCounts,
  getMissingFields,
  isBreakSlot,
  moveSession,
  pushPlannerHistory,
  redoPlannerHistory,
  scheduleSlots,
  seededSessions,
  sortSessions,
  undoPlannerHistory,
  updateScheduleSlot,
  type PlannerSession,
} from "../lib/planner";

const baseSessions: PlannerSession[] = [
  {
    id: "cursor",
    slotId: "slot-2",
    order: 1,
    sessionName: "Cursor",
    company: "Cursor",
    speaker: "",
    details: "Product/demo talk.",
    source: "seed",
  },
  {
    id: "case-study",
    slotId: "holding",
    order: 2,
    sessionName: "Real World Case Study",
    company: "",
    speaker: "",
    details: "Practitioner talk.",
    source: "seed",
  },
];

describe("planner helpers", () => {
  it("calls out the specific missing fields for a session", () => {
    expect(getMissingFields(baseSessions[0])).toEqual(["speaker"]);
    expect(getMissingFields(baseSessions[1])).toEqual(["company", "speaker"]);
  });

  it("counts sessions with topic, speaker, and unscheduled gaps", () => {
    expect(getGapCounts(baseSessions)).toEqual({
      topicGaps: 0,
      speakerGaps: 2,
      companyGaps: 1,
      unscheduled: 1,
    });
  });

  it("moves a session into a schedule slot and keeps the rest unchanged", () => {
    const moved = moveSession(baseSessions, "case-study", "slot-1");

    expect(moved.find((session) => session.id === "case-study")).toMatchObject({
      slotId: "slot-1",
      order: 0,
    });
    expect(moved.find((session) => session.id === "cursor")).toMatchObject({
      slotId: "slot-2",
      order: 1,
    });
  });

  it("creates a blank draft in the requested drop zone", () => {
    const draft = createDraftSession("holding", "draft-1");

    expect(draft).toMatchObject({
      id: "draft-1",
      slotId: "holding",
      sessionName: "",
      company: "",
      speaker: "",
      details: "",
      source: "user",
    });
  });

  it("sorts scheduled sessions before holding sessions", () => {
    expect(sortSessions(baseSessions).map((session) => session.id)).toEqual([
      "cursor",
      "case-study",
    ]);
  });

  it("finds sessions that changed between saved and draft state", () => {
    const draftSessions = [
      { ...baseSessions[0], speaker: "Ryo Lu" },
      baseSessions[1],
      createDraftSession("holding", "new-topic"),
    ];

    expect(getChangedSessionIds(baseSessions, draftSessions)).toEqual([
      "cursor",
      "new-topic",
    ]);
  });

  it("finds sessions that were deleted from the draft", () => {
    expect(getDeletedSessionIds(baseSessions, [baseSessions[0]])).toEqual([
      "case-study",
    ]);
  });

  it("keeps the revised morning leadership schedule in attendee-ready order", () => {
    expect(scheduleSlots.map((slot) => `${slot.timeBlock} ${slot.id}`)).toEqual([
      "8:45-9:00am slot-opening",
      "9:00-9:45am slot-jeff-belli",
      "9:45-10:30am slot-cursor",
      "10:30-11:00am slot-morning-break",
      "11:00-11:45am slot-openai",
      "11:45am-12:30pm slot-99-group",
      "12:30-1:30pm slot-lunch",
      "1:30-2:00pm slot-jimmy",
      "2:00-2:30pm slot-arize",
      "2:30-3:00pm slot-cognition",
      "3:00-4:30pm slot-action-lab",
      "4:30-5:00pm slot-closing",
    ]);

    expect(seededSessions.map((session) => session.id)).not.toContain(
      "practitioner-panel",
    );
  });

  it("does not count breaks as content, speaker, or company gaps", () => {
    const breakSession = seededSessions.find(
      (session) => session.id === "morning-break",
    );

    expect(breakSession).toMatchObject({
      company: "",
      speaker: "",
      details: "",
    });
    expect(getMissingFields(breakSession!)).toEqual([]);
  });

  it("marks schedule breaks so the UI can render them differently", () => {
    expect(isBreakSlot(scheduleSlots.find((slot) => slot.id === "slot-lunch")!)).toBe(
      true,
    );
    expect(isBreakSlot(scheduleSlots.find((slot) => slot.id === "slot-openai")!)).toBe(
      false,
    );
  });

  it("edits schedule slot time blocks without changing the slot identity", () => {
    const edited = updateScheduleSlot(scheduleSlots, "slot-openai", {
      timeBlock: "11:05-11:50am",
    });

    expect(edited.find((slot) => slot.id === "slot-openai")).toMatchObject({
      id: "slot-openai",
      timeBlock: "11:05-11:50am",
    });
    expect(getChangedSlotIds(scheduleSlots, edited)).toEqual(["slot-openai"]);
  });

  it("tracks planner snapshots for undo and redo", () => {
    const original = { sessions: baseSessions, slots: scheduleSlots };
    const edited = {
      sessions: [{ ...baseSessions[0], speaker: "Nick Miller" }, baseSessions[1]],
      slots: scheduleSlots,
    };
    const secondEdit = {
      sessions: edited.sessions,
      slots: updateScheduleSlot(scheduleSlots, "slot-cursor", {
        timeBlock: "9:50-10:30am",
      }),
    };

    const history = pushPlannerHistory(
      pushPlannerHistory(createPlannerHistory(original), edited),
      secondEdit,
    );

    expect(history.past).toHaveLength(2);
    expect(history.future).toHaveLength(0);

    const undone = undoPlannerHistory(history);
    expect(undone.present).toEqual(edited);
    expect(undone.future).toEqual([secondEdit]);

    const redone = redoPlannerHistory(undone);
    expect(redone.present).toEqual(secondEdit);
    expect(redone.future).toEqual([]);
  });

  it("does not add duplicate undo history entries for unchanged snapshots", () => {
    const snapshot = { sessions: baseSessions, slots: scheduleSlots };
    const history = pushPlannerHistory(createPlannerHistory(snapshot), {
      sessions: [...baseSessions],
      slots: [...scheduleSlots],
    });

    expect(history.past).toHaveLength(0);
    expect(getPlannerSnapshotSignature(history.present)).toBe(
      getPlannerSnapshotSignature(snapshot),
    );
  });
});
