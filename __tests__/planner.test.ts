import { describe, expect, it } from "vitest";
import {
  createPlannerHistory,
  createScheduleSlotForSession,
  createDraftSession,
  getDeletedSlotIds,
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
      "2:00-2:30pm slot-cognition",
      "2:30-3:00pm slot-arize",
      "3:30-4:00pm slot-afternoon-break",
      "4:00-5:00pm slot-action-lab",
    ]);

    expect(seededSessions.map((session) => session.id)).not.toContain(
      "practitioner-panel",
    );
    expect(seededSessions.map((session) => session.id)).not.toContain("closing");
    expect(seededSessions.find((session) => session.id === "action-lab")).toMatchObject({
      slotId: "slot-action-lab",
      sessionName: "Peer Discussion & Wrap-Up",
    });
    expect(seededSessions.find((session) => session.id === "action-lab")?.details).toContain(
      "final five-minute wrap-up",
    );
  });

  it("frames the afternoon leadership slots as prepare, deploy, govern", () => {
    expect(scheduleSlots.slice(7, 10).map((slot) => `${slot.timeBlock} ${slot.id}`)).toEqual([
      "1:30-2:00pm slot-jimmy",
      "2:00-2:30pm slot-cognition",
      "2:30-3:00pm slot-arize",
    ]);

    expect(seededSessions.find((session) => session.id === "jimmy-lai")).toMatchObject({
      slotId: "slot-jimmy",
      sessionName: "Building the Agent-Ready Development Organization",
      company: "Vercel",
      speaker: "Jimmy Lai",
    });
    expect(seededSessions.find((session) => session.id === "jimmy-lai")?.details).toContain(
      "how teams organize codebases, developer workflows, and ownership models",
    );

    expect(seededSessions.find((session) => session.id === "cognition")).toMatchObject({
      slotId: "slot-cognition",
      sessionName: "Running Background Agents at Enterprise Scale",
      company: "Cognition",
    });
    expect(seededSessions.find((session) => session.id === "cognition")?.details).toContain(
      "managing agents as teammates",
    );

    expect(seededSessions.find((session) => session.id === "arize-evals")).toMatchObject({
      slotId: "slot-arize",
      sessionName: "Evaluating Agentic Systems in Production",
      company: "Arize",
    });
    expect(seededSessions.find((session) => session.id === "arize-evals")?.details).toContain(
      "evaluation becomes part of the production operating system",
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

    const afternoonBreak = seededSessions.find(
      (session) => session.id === "afternoon-break",
    );

    expect(afternoonBreak).toMatchObject({
      company: "",
      speaker: "",
      details: "",
    });
    expect(getMissingFields(afternoonBreak!)).toEqual([]);
  });

  it("marks schedule breaks so the UI can render them differently", () => {
    expect(isBreakSlot(scheduleSlots.find((slot) => slot.id === "slot-lunch")!)).toBe(
      true,
    );
    expect(
      isBreakSlot(scheduleSlots.find((slot) => slot.id === "slot-afternoon-break")!),
    ).toBe(true);
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

  it("splits a stacked session into its own editable time slot", () => {
    const stackedSessions: PlannerSession[] = [
      {
        ...baseSessions[0],
        id: "cognition",
        slotId: "slot-cognition",
        order: 0,
      },
      {
        ...baseSessions[1],
        id: "panel-qa",
        slotId: "slot-cognition",
        order: 1,
        sessionName: "Panel Q&A with Speakers",
      },
    ];

    const result = createScheduleSlotForSession(
      stackedSessions,
      scheduleSlots,
      "panel-qa",
      {
        id: "slot-panel-qa",
        timeBlock: "3:00-3:30pm",
        label: "Panel Q&A",
      },
    );

    expect(result.slots.find((slot) => slot.id === "slot-panel-qa")).toEqual({
      id: "slot-panel-qa",
      order: 8.5,
      timeBlock: "3:00-3:30pm",
      label: "Panel Q&A",
      kind: "session",
    });
    expect(result.sessions.find((session) => session.id === "panel-qa")).toMatchObject({
      slotId: "slot-panel-qa",
      order: 0,
    });
  });

  it("finds schedule slots deleted from the draft", () => {
    const draftSlots = scheduleSlots.filter((slot) => slot.id !== "slot-cognition");

    expect(getDeletedSlotIds(scheduleSlots, draftSlots)).toEqual([
      "slot-cognition",
    ]);
  });
});
