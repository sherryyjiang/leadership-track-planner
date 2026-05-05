export const HOLDING_SLOT_ID = "holding";

export type PlannerSession = {
  id: string;
  slotId: string;
  order: number;
  sessionName: string;
  company: string;
  speaker: string;
  details: string;
  source: "seed" | "user";
};

export type ScheduleSlot = {
  id: string;
  timeBlock: string;
  label: string;
};

export type MissingField = "sessionName" | "company" | "speaker" | "details";

export const scheduleSlots: ScheduleSlot[] = [
  { id: "slot-opening", timeBlock: "8:45-9:00am", label: "Opening" },
  { id: "slot-case-1", timeBlock: "9:00-9:30am", label: "Case study #1" },
  { id: "slot-cursor", timeBlock: "9:30-10:30am", label: "Product talk" },
  { id: "slot-morning-break", timeBlock: "10:30-11:00am", label: "Break" },
  { id: "slot-case-2", timeBlock: "11:00-11:30am", label: "Case study #2" },
  { id: "slot-openai", timeBlock: "11:30am-12:00pm", label: "Product talk" },
  { id: "slot-panel", timeBlock: "12:00-12:30pm", label: "Panel" },
  { id: "slot-lunch", timeBlock: "12:30-1:30pm", label: "Lunch" },
  { id: "slot-jimmy", timeBlock: "1:30-2:00pm", label: "Implementation talk" },
  { id: "slot-arize", timeBlock: "2:00-2:30pm", label: "Evals" },
  { id: "slot-cognition", timeBlock: "2:30-3:00pm", label: "Agents at scale" },
  { id: "slot-afternoon-break", timeBlock: "3:00-3:30pm", label: "Break" },
  { id: "slot-action-lab", timeBlock: "3:30-4:30pm", label: "Action lab" },
  { id: "slot-closing", timeBlock: "4:30-5:00pm", label: "Closing" },
];

export const seededSessions: PlannerSession[] = [
  {
    id: "opening-welcome",
    slotId: "slot-opening",
    order: 0,
    sessionName: "Opening: Welcome to the Leadership Track",
    company: "AI Engineer",
    speaker: "Sherry Jiang",
    details:
      "Frame the day's arc: alternate between what is possible from tool companies and how organizations actually shipped it. Set a grounded real-talk tone.",
    source: "seed",
  },
  {
    id: "case-study-1",
    slotId: "slot-case-1",
    order: 0,
    sessionName: "Real World Case Study #1",
    company: "",
    speaker: "",
    details:
      "Practitioner talk on deployed AI across a team or organization: what worked, what broke, and what they would do differently.",
    source: "seed",
  },
  {
    id: "cursor",
    slotId: "slot-cursor",
    order: 0,
    sessionName: "Cursor",
    company: "Cursor",
    speaker: "",
    details:
      "Product/demo talk positioned after a case study so the audience evaluates through a practical lens rather than just novelty.",
    source: "seed",
  },
  {
    id: "morning-break",
    slotId: "slot-morning-break",
    order: 0,
    sessionName: "Morning Break",
    company: "AI Engineer",
    speaker: "N/A",
    details: "Coffee reset and hallway discussion.",
    source: "seed",
  },
  {
    id: "case-study-2",
    slotId: "slot-case-2",
    order: 0,
    sessionName: "Real World Case Study #2",
    company: "",
    speaker: "",
    details:
      "Second practitioner story. Ideally a different industry or scale from the first case study.",
    source: "seed",
  },
  {
    id: "openai-codex",
    slotId: "slot-openai",
    order: 0,
    sessionName: "OpenAI / Codex",
    company: "OpenAI",
    speaker: "",
    details:
      "Product/demo talk. The case study to tool-company alternation keeps energy varied and prevents sponsor-showcase fatigue.",
    source: "seed",
  },
  {
    id: "practitioner-panel",
    slotId: "slot-panel",
    order: 0,
    sessionName: "Practitioner Panel",
    company: "Multiple",
    speaker: "",
    details:
      "Two to three leaders who have implemented AI at their organizations. Conversational pre-lunch format with practical takeaways.",
    source: "seed",
  },
  {
    id: "lunch",
    slotId: "slot-lunch",
    order: 0,
    sessionName: "Lunch Break",
    company: "AI Engineer",
    speaker: "N/A",
    details: "Lunch and peer discussion.",
    source: "seed",
  },
  {
    id: "jimmy-lai",
    slotId: "slot-jimmy",
    order: 0,
    sessionName: "Make your organization work for agents",
    company: "",
    speaker: "Jimmy Lai",
    details:
      "Agent implementation at scale and how to structure teams around agents. Strong post-lunch concrete topic.",
    source: "seed",
  },
  {
    id: "arize-evals",
    slotId: "slot-arize",
    order: 0,
    sessionName: "Evals",
    company: "Arize",
    speaker: "",
    details:
      "Practical evals talk for leaders moving from tools and case studies into measurement, reliability, and production feedback loops.",
    source: "seed",
  },
  {
    id: "cognition",
    slotId: "slot-cognition",
    order: 0,
    sessionName: "Cognition",
    company: "Cognition",
    speaker: "",
    details:
      "Cloud/background agents at enterprise scale. Anchors the tool-company portion of the day with a forward-looking product vision.",
    source: "seed",
  },
  {
    id: "afternoon-break",
    slotId: "slot-afternoon-break",
    order: 0,
    sessionName: "Afternoon Break",
    company: "AI Engineer",
    speaker: "N/A",
    details: "Coffee reset before the working session.",
    source: "seed",
  },
  {
    id: "action-lab",
    slotId: "slot-action-lab",
    order: 0,
    sessionName: "Leadership Action Lab",
    company: "AI Engineer",
    speaker: "Facilitators TBD",
    details:
      "Facilitated roundtables where attendees cluster around themes, work through a framework, and leave with an implementation playbook or 90-day action plan.",
    source: "seed",
  },
  {
    id: "closing",
    slotId: "slot-closing",
    order: 0,
    sessionName: "Closing: Sharebacks & Takeaways",
    company: "AI Engineer",
    speaker: "Sherry Jiang",
    details:
      "Groups share their top insight or commitment. Sherry wraps with key themes so people leave with something they made, not just something they heard.",
    source: "seed",
  },
  {
    id: "darius-99co",
    slotId: HOLDING_SLOT_ID,
    order: 0,
    sessionName: "99.co implementation story",
    company: "99.co",
    speaker: "Darius",
    details: "Candidate real-world case study from a builder/operator.",
    source: "seed",
  },
  {
    id: "jeff-belli",
    slotId: HOLDING_SLOT_ID,
    order: 1,
    sessionName: "Belli implementation story",
    company: "Belli",
    speaker: "Jeff Pan",
    details: "Candidate real-world case study for the practitioner arc.",
    source: "seed",
  },
  {
    id: "governance-roundtable",
    slotId: HOLDING_SLOT_ID,
    order: 2,
    sessionName: "Governance and risk operator talk",
    company: "",
    speaker: "",
    details:
      "Potential session on governing agents and AI workflows in regulated or high-stakes environments.",
    source: "seed",
  },
  {
    id: "roi-measurement",
    slotId: HOLDING_SLOT_ID,
    order: 3,
    sessionName: "ROI and adoption measurement",
    company: "",
    speaker: "",
    details:
      "Potential topic on reliability, ROI, cost, and production ownership metrics.",
    source: "seed",
  },
];

export function getMissingFields(session: PlannerSession): MissingField[] {
  const fields: MissingField[] = [];
  if (!session.sessionName.trim()) fields.push("sessionName");
  if (!session.company.trim()) fields.push("company");
  if (!session.speaker.trim()) fields.push("speaker");
  if (!session.details.trim()) fields.push("details");
  return fields;
}

export function getGapCounts(sessions: PlannerSession[]) {
  return sessions.reduce(
    (counts, session) => {
      const missing = getMissingFields(session);
      return {
        topicGaps:
          counts.topicGaps +
          (missing.includes("sessionName") || missing.includes("details")
            ? 1
            : 0),
        speakerGaps: counts.speakerGaps + (missing.includes("speaker") ? 1 : 0),
        companyGaps: counts.companyGaps + (missing.includes("company") ? 1 : 0),
        unscheduled:
          counts.unscheduled + (session.slotId === HOLDING_SLOT_ID ? 1 : 0),
      };
    },
    { topicGaps: 0, speakerGaps: 0, companyGaps: 0, unscheduled: 0 },
  );
}

export function createDraftSession(
  slotId: string,
  id = `session-${Date.now()}`,
): PlannerSession {
  return {
    id,
    slotId,
    order: 0,
    sessionName: "",
    company: "",
    speaker: "",
    details: "",
    source: "user",
  };
}

export function moveSession(
  sessions: PlannerSession[],
  sessionId: string,
  targetSlotId: string,
): PlannerSession[] {
  const targetOrder = sessions.filter(
    (session) => session.slotId === targetSlotId && session.id !== sessionId,
  ).length;

  return sessions.map((session) =>
    session.id === sessionId
      ? { ...session, slotId: targetSlotId, order: targetOrder }
      : session,
  );
}

export function sortSessions(sessions: PlannerSession[]): PlannerSession[] {
  const slotIndex = new Map(
    scheduleSlots.map((slot, index) => [slot.id, index] as const),
  );

  return [...sessions].sort((a, b) => {
    const aSlot = slotIndex.get(a.slotId) ?? Number.MAX_SAFE_INTEGER;
    const bSlot = slotIndex.get(b.slotId) ?? Number.MAX_SAFE_INTEGER;
    if (aSlot !== bSlot) return aSlot - bSlot;
    if (a.order !== b.order) return a.order - b.order;
    return a.sessionName.localeCompare(b.sessionName);
  });
}

export function getChangedSessionIds(
  savedSessions: PlannerSession[],
  draftSessions: PlannerSession[],
): string[] {
  const savedById = new Map(
    savedSessions.map((session) => [session.id, session] as const),
  );

  return draftSessions
    .filter((draft) => {
      const saved = savedById.get(draft.id);
      if (!saved) return true;

      return (
        saved.slotId !== draft.slotId ||
        saved.order !== draft.order ||
        saved.sessionName !== draft.sessionName ||
        saved.company !== draft.company ||
        saved.speaker !== draft.speaker ||
        saved.details !== draft.details ||
        saved.source !== draft.source
      );
    })
    .map((session) => session.id);
}

export function getDeletedSessionIds(
  savedSessions: PlannerSession[],
  draftSessions: PlannerSession[],
): string[] {
  const draftIds = new Set(draftSessions.map((session) => session.id));
  return savedSessions
    .filter((session) => !draftIds.has(session.id))
    .map((session) => session.id);
}
