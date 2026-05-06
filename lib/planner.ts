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
  order: number;
  timeBlock: string;
  label: string;
  kind: "session" | "break";
};

export type PlannerSnapshot = {
  sessions: PlannerSession[];
  slots: ScheduleSlot[];
};

export type PlannerHistory = {
  past: PlannerSnapshot[];
  present: PlannerSnapshot;
  future: PlannerSnapshot[];
};

export type MissingField = "sessionName" | "company" | "speaker" | "details";

export const scheduleSlots: ScheduleSlot[] = [
  {
    id: "slot-opening",
    order: 0,
    timeBlock: "8:45-9:00am",
    label: "Opening",
    kind: "session",
  },
  {
    id: "slot-jeff-belli",
    order: 1,
    timeBlock: "9:00-9:45am",
    label: "Operator talk",
    kind: "session",
  },
  {
    id: "slot-cursor",
    order: 2,
    timeBlock: "9:45-10:30am",
    label: "Product talk",
    kind: "session",
  },
  {
    id: "slot-morning-break",
    order: 3,
    timeBlock: "10:30-11:00am",
    label: "Break",
    kind: "break",
  },
  {
    id: "slot-openai",
    order: 4,
    timeBlock: "11:00-11:45am",
    label: "Product talk",
    kind: "session",
  },
  {
    id: "slot-99-group",
    order: 5,
    timeBlock: "11:45am-12:30pm",
    label: "Operator talk",
    kind: "session",
  },
  {
    id: "slot-lunch",
    order: 6,
    timeBlock: "12:30-1:30pm",
    label: "Lunch",
    kind: "break",
  },
  {
    id: "slot-jimmy",
    order: 7,
    timeBlock: "1:30-2:00pm",
    label: "Implementation talk",
    kind: "session",
  },
  {
    id: "slot-arize",
    order: 8,
    timeBlock: "2:00-2:30pm",
    label: "Evals",
    kind: "session",
  },
  {
    id: "slot-cognition",
    order: 9,
    timeBlock: "2:30-3:00pm",
    label: "Agents at scale",
    kind: "session",
  },
  {
    id: "slot-action-lab",
    order: 10,
    timeBlock: "3:00-4:30pm",
    label: "Action lab",
    kind: "session",
  },
  {
    id: "slot-closing",
    order: 11,
    timeBlock: "4:30-5:00pm",
    label: "Closing",
    kind: "session",
  },
];

export const seededSessions: PlannerSession[] = [
  {
    id: "opening-welcome",
    slotId: "slot-opening",
    order: 0,
    sessionName: "Opening: Welcome to the Leadership Track",
    company: "AI Engineer",
    speaker: "AI Engineer Team",
    details:
      "We will set the stage for a day that moves between real-world implementation stories, product and lab perspectives, practical operating topics like evals, and interactive peer discussion. Attendees will be invited to share the questions and pain points they want to work through, then use those inputs to connect with relevant peers and leave with clearer next questions, practical examples, and a better sense of what AI adoption can look like inside their own organizations.",
    source: "seed",
  },
  {
    id: "jeff-belli",
    slotId: "slot-jeff-belli",
    order: 0,
    sessionName:
      "From AI Hype to Operating Systems: Rebuilding the Modern Company with AI",
    company: "Belli",
    speaker: "Jeff Pan",
    details:
      "AI is forcing companies to rewrite nearly every traditional startup and enterprise playbook, from how teams are structured and hired to how products are built, evaluated, and scaled. In this session, Jeff Pan shares lessons from building Belli into an AI-native company internally: the workflows, operating principles, hiring approaches, and decision-making frameworks that helped the team move faster, along with the experiments that failed along the way. Drawing from both startup execution and enterprise deployments in the airline industry, he will unpack what it actually takes for organizations to move from AI pilots to production, including internal buy-in, operational resistance, governance, and deciding which initiatives to scale, kill, or rethink entirely. Attendees can expect a candid look at what is working in real-world AI transformation today.",
    source: "seed",
  },
  {
    id: "cursor",
    slotId: "slot-cursor",
    order: 0,
    sessionName:
      "Context Window Engineering: Deploying AI-Native Development Inside Real Organizations",
    company: "Cursor",
    speaker: "Nick Miller, Field Engineer",
    details:
      "As enterprises race to adopt AI-native development tools, many organizations are discovering that the challenge is no longer just access to models. It is redesigning how teams actually build, collaborate, and ship software. In this session, Cursor field engineer Nick Miller shares lessons from working directly with engineering organizations across Asia: how companies are integrating AI coding agents into production workflows, where adoption succeeds or breaks down, and the operational patterns emerging inside high-performing AI-native teams. Drawing from real customer implementations, he will unpack topics like context window engineering, AI-assisted workflows, flatter team structures, and why the most successful rollouts are often driven bottom-up by internal champions rather than top-down mandates. The session will also explore how organizations are rethinking ownership, engineering roles, onboarding, and internal operating playbooks as AI shifts software teams from writing code manually to supervising increasingly autonomous systems.",
    source: "seed",
  },
  {
    id: "morning-break",
    slotId: "slot-morning-break",
    order: 0,
    sessionName: "Morning Break",
    company: "",
    speaker: "",
    details: "",
    source: "seed",
  },
  {
    id: "openai-operationalizing-ai",
    slotId: "slot-openai",
    order: 0,
    sessionName:
      "From Experimentation to Execution: Operationalizing AI Inside Modern Organizations",
    company: "OpenAI",
    speaker: "Speaker from OpenAI",
    details:
      "As organizations move beyond early AI experimentation, many teams are facing a new set of challenges: deciding which initiatives to scale or kill, integrating AI into measurable production workflows, and redesigning teams and operating models around increasingly autonomous systems. In this session, a speaker from OpenAI will share perspectives and lessons from organizations deploying AI systems in production, including common implementation patterns, operational bottlenecks, and the organizational shifts emerging as AI adoption expands beyond isolated innovation teams. The discussion will explore production readiness, governance and accountability, workflow selection, reliability and observability, human-AI collaboration, and how organizations are navigating the transition from pilots to long-term operational systems. Attendees can expect practical insight into the realities of AI deployment at scale, from adoption and internal enablement to questions around ownership, trust, evaluation, and sustaining organizational change as AI capabilities continue to evolve.",
    source: "seed",
  },
  {
    id: "erwin-99-group",
    slotId: "slot-99-group",
    order: 0,
    sessionName:
      "Doing More with Less: Building High-Leverage AI Teams Inside Real Organizations",
    company: "99 Group (99.co)",
    speaker: "Erwin Lee, Group CTO",
    details:
      "As AI capabilities rapidly improve, one of the biggest challenges facing engineering leaders is no longer just shipping features. It is learning how to maximize output, efficiency, and organizational leverage without letting cost and complexity spiral out of control. In this session, Erwin Lee, Group CTO of 99 Group, will share practical lessons from leading engineering teams inside one of Southeast Asia's largest proptech platforms, including how teams are thinking about AI-native workflows, engineering productivity, organizational structure, and operational efficiency at scale. The discussion will explore maximizing output per engineering dollar, managing token and compute costs, deciding where AI meaningfully improves workflows versus where it creates overhead, and how mid-sized technology companies are evolving their operating playbooks in the AI era. Attendees can expect candid insights into the realities of deploying AI inside production organizations: balancing speed with reliability, identifying high-leverage internal use cases, and building teams that can move quickly without losing operational discipline.",
    source: "seed",
  },
  {
    id: "lunch",
    slotId: "slot-lunch",
    order: 0,
    sessionName: "Lunch Break",
    company: "",
    speaker: "",
    details: "",
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
    id: "governance-roundtable",
    slotId: HOLDING_SLOT_ID,
    order: 0,
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
    order: 1,
    sessionName: "ROI and adoption measurement",
    company: "",
    speaker: "",
    details:
      "Potential topic on reliability, ROI, cost, and production ownership metrics.",
    source: "seed",
  },
];

export function getMissingFields(session: PlannerSession): MissingField[] {
  if (isBreakSession(session)) return [];

  const fields: MissingField[] = [];
  if (!session.sessionName.trim()) fields.push("sessionName");
  if (!session.company.trim()) fields.push("company");
  if (!session.speaker.trim()) fields.push("speaker");
  if (!session.details.trim()) fields.push("details");
  return fields;
}

export function isBreakSlot(slot: ScheduleSlot): boolean {
  return slot.kind === "break";
}

export function isBreakSession(session: PlannerSession): boolean {
  return scheduleSlots.some(
    (slot) => isBreakSlot(slot) && slot.id === session.slotId,
  );
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

export function sortScheduleSlots(slots: ScheduleSlot[]): ScheduleSlot[] {
  return [...slots].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.timeBlock.localeCompare(b.timeBlock);
  });
}

export function sortSessions(
  sessions: PlannerSession[],
  slots: ScheduleSlot[] = scheduleSlots,
): PlannerSession[] {
  const slotIndex = new Map(
    sortScheduleSlots(slots).map((slot, index) => [slot.id, index] as const),
  );

  return [...sessions].sort((a, b) => {
    const aSlot = slotIndex.get(a.slotId) ?? Number.MAX_SAFE_INTEGER;
    const bSlot = slotIndex.get(b.slotId) ?? Number.MAX_SAFE_INTEGER;
    if (aSlot !== bSlot) return aSlot - bSlot;
    if (a.order !== b.order) return a.order - b.order;
    return a.sessionName.localeCompare(b.sessionName);
  });
}

export function updateScheduleSlot(
  slots: ScheduleSlot[],
  slotId: string,
  patch: Partial<Pick<ScheduleSlot, "timeBlock" | "label">>,
): ScheduleSlot[] {
  return slots.map((slot) =>
    slot.id === slotId ? { ...slot, ...patch } : slot,
  );
}

export function getChangedSlotIds(
  savedSlots: ScheduleSlot[],
  draftSlots: ScheduleSlot[],
): string[] {
  const savedById = new Map(savedSlots.map((slot) => [slot.id, slot] as const));

  return draftSlots
    .filter((draft) => {
      const saved = savedById.get(draft.id);
      if (!saved) return true;

      return (
        saved.order !== draft.order ||
        saved.timeBlock !== draft.timeBlock ||
        saved.label !== draft.label ||
        saved.kind !== draft.kind
      );
    })
    .map((slot) => slot.id);
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

export function createPlannerHistory(
  initialSnapshot: PlannerSnapshot,
): PlannerHistory {
  return {
    past: [],
    present: initialSnapshot,
    future: [],
  };
}

export function pushPlannerHistory(
  history: PlannerHistory,
  nextSnapshot: PlannerSnapshot,
): PlannerHistory {
  if (
    getPlannerSnapshotSignature(history.present) ===
    getPlannerSnapshotSignature(nextSnapshot)
  ) {
    return history;
  }

  return {
    past: [...history.past, history.present],
    present: nextSnapshot,
    future: [],
  };
}

export function undoPlannerHistory(history: PlannerHistory): PlannerHistory {
  const previous = history.past.at(-1);
  if (!previous) return history;

  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redoPlannerHistory(history: PlannerHistory): PlannerHistory {
  const next = history.future[0];
  if (!next) return history;

  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
  };
}

export function replacePlannerHistoryPresent(
  history: PlannerHistory,
  nextSnapshot: PlannerSnapshot,
): PlannerHistory {
  return {
    ...history,
    present: nextSnapshot,
  };
}

export function getPlannerSnapshotSignature(snapshot: PlannerSnapshot): string {
  return [
    snapshot.sessions
      .map(
        (session) =>
          `${session.id}:${session.slotId}:${session.order}:${session.sessionName}:${session.company}:${session.speaker}:${session.details}:${session.source}`,
      )
      .join("|"),
    snapshot.slots
      .map(
        (slot) =>
          `${slot.id}:${slot.order}:${slot.timeBlock}:${slot.label}:${slot.kind}`,
      )
      .join("|"),
  ].join("||");
}
