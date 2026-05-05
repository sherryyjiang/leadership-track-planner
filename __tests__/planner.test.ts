import { describe, expect, it } from "vitest";
import {
  createDraftSession,
  getChangedSessionIds,
  getDeletedSessionIds,
  getGapCounts,
  getMissingFields,
  moveSession,
  sortSessions,
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
});
