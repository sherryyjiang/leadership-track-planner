"use client";

import {
  Component,
  useEffect,
  useMemo,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  Archive,
  GripVertical,
  Plus,
  RefreshCcw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HOLDING_SLOT_ID,
  createDraftSession,
  getChangedSessionIds,
  getDeletedSessionIds,
  getGapCounts,
  getMissingFields,
  moveSession as moveSessionLocal,
  scheduleSlots,
  seededSessions,
  sortSessions,
  type MissingField,
  type PlannerSession,
} from "@/lib/planner";

type PlannerActions = {
  addSession: (slotId: string) => void;
  deleteSession: (sessionId: string) => void;
  moveSession: (sessionId: string, slotId: string) => void;
  reset: () => void;
  save: () => Promise<void>;
  updateSession: (
    sessionId: string,
    patch: Partial<
      Pick<
        PlannerSession,
        "sessionName" | "company" | "speaker" | "details"
      >
    >,
  ) => void;
};

const STORAGE_KEY = "leadership-track-planner:sessions";
const LAST_SAVED_KEY = "leadership-track-planner:last-saved-at";

export function LeadershipPlannerApp({
  convexConfigured,
}: {
  convexConfigured: boolean;
}) {
  if (convexConfigured) {
    return (
      <PlannerErrorBoundary>
        <ConvexPlanner />
      </PlannerErrorBoundary>
    );
  }

  return <LocalPlanner />;
}

class PlannerErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(error, errorInfo);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <PlannerBoard
        mode="Local"
        sessions={seededSessions}
        loading={false}
        persistSessions={async () => undefined}
        resetSessions={async () => undefined}
        errorMessage="Convex is still syncing or the local dev server needs a restart. Refresh after Convex says functions are ready, or restart npm run dev."
      />
    );
  }
}

function ConvexPlanner() {
  const sessions = useQuery(api.sessions.list);
  const seedDefaults = useMutation(api.sessions.seedDefaults);
  const createSession = useMutation(api.sessions.create);
  const deleteSession = useMutation(api.sessions.remove);
  const updateSessionMutation = useMutation(api.sessions.update);
  const resetToSeed = useMutation(api.sessions.resetToSeed);

  useEffect(() => {
    if (sessions && sessions.length === 0) {
      void seedDefaults();
    }
  }, [seedDefaults, sessions]);

  const visibleSessions = sessions && sessions.length > 0 ? sessions : seededSessions;

  return (
    <PlannerBoard
      key={getSessionsSignature(visibleSessions)}
      mode="Convex"
      sessions={sortSessions(visibleSessions)}
      loading={!sessions}
      persistSessions={async (draftSessions) => {
        const existingIds = new Set(sessions?.map((session) => session.id) ?? []);
        const draftIds = new Set(draftSessions.map((session) => session.id));
        const deletedIds =
          sessions
            ?.filter((session) => !draftIds.has(session.id))
            .map((session) => session.id) ?? [];

        await Promise.all(
          [
            ...deletedIds.map((clientId) => deleteSession({ clientId })),
            ...draftSessions.map((session) => {
              if (!existingIds.has(session.id)) {
                return createSession({
                  clientId: session.id,
                  slotId: session.slotId,
                  order: session.order,
                  sessionName: session.sessionName,
                  company: session.company,
                  speaker: session.speaker,
                  details: session.details,
                  source: session.source,
                });
              }

              return updateSessionMutation({
                clientId: session.id,
                slotId: session.slotId,
                order: session.order,
                sessionName: session.sessionName,
                company: session.company,
                speaker: session.speaker,
                details: session.details,
              });
            }),
          ],
        );
      }}
      resetSessions={async () => {
        await resetToSeed();
      }}
    />
  );
}

function LocalPlanner() {
  const [savedSessions, setSavedSessions] = useState<PlannerSession[]>(() => {
    if (typeof window === "undefined") return seededSessions;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as PlannerSession[]) : seededSessions;
    } catch {
      return seededSessions;
    }
  });

  return (
    <PlannerBoard
      key="local-planner"
      mode="Local"
      sessions={sortSessions(savedSessions)}
      loading={false}
      persistSessions={async (draftSessions) => {
        const sorted = sortSessions(draftSessions);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
        window.localStorage.setItem(LAST_SAVED_KEY, new Date().toISOString());
        setSavedSessions(sorted);
      }}
      resetSessions={async () => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seededSessions));
        window.localStorage.setItem(LAST_SAVED_KEY, new Date().toISOString());
        setSavedSessions(seededSessions);
      }}
    />
  );
}

function PlannerBoard({
  mode,
  sessions,
  loading,
  persistSessions,
  resetSessions,
  errorMessage,
}: {
  mode: "Convex" | "Local";
  sessions: PlannerSession[];
  loading: boolean;
  persistSessions: (sessions: PlannerSession[]) => Promise<void>;
  resetSessions: () => Promise<void>;
  errorMessage?: string;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draftSessions, setDraftSessions] = useState<PlannerSession[]>(sessions);
  const [saveState, setSaveState] = useState<
    "saved" | "unsaved" | "saving" | "error"
  >("saved");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const changedIds = useMemo(
    () => getChangedSessionIds(sessions, draftSessions),
    [sessions, draftSessions],
  );
  const deletedIds = useMemo(
    () => getDeletedSessionIds(sessions, draftSessions),
    [sessions, draftSessions],
  );
  const unsavedChangeCount = changedIds.length + deletedIds.length;
  const hasUnsavedChanges = unsavedChangeCount > 0;
  const gapCounts = useMemo(() => getGapCounts(draftSessions), [draftSessions]);
  const scheduledCount = draftSessions.filter(
    (session) => session.slotId !== HOLDING_SLOT_ID,
  ).length;
  const holdingSessions = draftSessions.filter(
    (session) => session.slotId === HOLDING_SLOT_ID,
  );

  const actions: PlannerActions = {
    addSession: (slotId) => {
      setDraftSessions((current) => {
        const draft = createDraftSession(slotId);
        return [
          ...current,
          {
            ...draft,
            order: current.filter((session) => session.slotId === slotId).length,
          },
        ];
      });
      setSaveState("unsaved");
    },
    deleteSession: (sessionId) => {
      setDraftSessions((current) =>
        current.filter((session) => session.id !== sessionId),
      );
      setSaveState("unsaved");
    },
    moveSession: (sessionId, slotId) => {
      setDraftSessions((current) => moveSessionLocal(current, sessionId, slotId));
      setSaveState("unsaved");
    },
    reset: async () => {
      setSaveState("saving");
      try {
        await resetSessions();
        setDraftSessions(seededSessions);
        setLastSavedAt(new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }));
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    save: async () => {
      if (!hasUnsavedChanges) return;

      setSaveState("saving");
      try {
        const sortedDraft = sortSessions(draftSessions);
        await persistSessions(sortedDraft);
        setDraftSessions(sortedDraft);
        setLastSavedAt(new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }));
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    updateSession: (sessionId, patch) => {
      setDraftSessions((current) =>
        current.map((session) =>
          session.id === sessionId ? { ...session, ...patch } : session,
        ),
      );
      setSaveState("unsaved");
    },
  };

  function handleDrop(slotId: string, sessionId: string) {
    actions.moveSession(sessionId, slotId);
    setDraggingId(null);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#111315] text-zinc-100">
      <section className="border-b border-white/10 bg-[#171a1d]">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-300">
                AI Engineer Singapore / May 15, 2026
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                Leadership Track Planner
              </h1>
              <p className="mt-2 max-w-[min(42rem,calc(100vw-2rem))] break-words text-sm leading-6 text-zinc-400">
                Working agenda for case studies, tool perspectives, and the
                action lab.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex min-w-48 items-center rounded-md border border-white/10 bg-[#111315] px-3 py-2 text-sm text-zinc-300">
                <span
                  className={[
                    "mr-2 h-2 w-2 rounded-full",
                    saveState === "saved" ? "bg-emerald-400" : "",
                    saveState === "unsaved" ? "bg-amber-300" : "",
                    saveState === "saving" ? "bg-cyan-300" : "",
                    saveState === "error" ? "bg-red-400" : "",
                  ].join(" ")}
                />
                {saveState === "saved" &&
                  (lastSavedAt ? `Saved at ${lastSavedAt}` : "All changes saved")}
                {saveState === "unsaved" &&
                  `${unsavedChangeCount} unsaved ${
                    unsavedChangeCount === 1 ? "change" : "changes"
                  }`}
                {saveState === "saving" && "Saving changes..."}
                {saveState === "error" && "Save failed"}
              </div>
              <Button
                type="button"
                className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50"
                disabled={!hasUnsavedChanges || saveState === "saving" || loading}
                onClick={() => {
                  void actions.save();
                }}
              >
                <Save className="h-4 w-4" />
                Save changes
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                onClick={() => actions.addSession(HOLDING_SLOT_ID)}
              >
                <Plus className="h-4 w-4" />
                Add holding item
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-white/15 bg-transparent text-zinc-100 hover:bg-white/10 hover:text-white"
                onClick={() => {
                  void actions.reset();
                }}
              >
                <RefreshCcw className="h-4 w-4" />
                Reset seed
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <Metric label="Sessions" value={draftSessions.length} />
            <Metric label="Scheduled" value={scheduledCount} />
            <Metric label="Unscheduled" value={gapCounts.unscheduled} />
            <Metric label="Topic gaps" value={gapCounts.topicGaps} />
            <Metric label="Company gaps" value={gapCounts.companyGaps} />
            <Metric label="Speaker gaps" value={gapCounts.speakerGaps} />
          </div>

          {errorMessage && (
            <div className="rounded-md border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {errorMessage}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-[#191c1f]">
          <div className="overflow-x-auto">
            <div className="min-w-[920px]">
              <div className="grid grid-cols-[130px_minmax(180px,1.1fr)_minmax(150px,.8fr)_minmax(170px,.9fr)_minmax(280px,1.6fr)_48px] border-b border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <div>Time block</div>
                <div>Session name</div>
                <div>Company</div>
                <div>Speaker</div>
                <div>Details</div>
                <div />
              </div>
              {scheduleSlots.map((slot) => {
                const slotSessions = draftSessions.filter(
                  (session) => session.slotId === slot.id,
                );

                return (
                  <ScheduleSlotRows
                    key={slot.id}
                    slotId={slot.id}
                    timeBlock={slot.timeBlock}
                    label={slot.label}
                    sessions={slotSessions}
                    draggingId={draggingId}
                    setDraggingId={setDraggingId}
                    onDrop={handleDrop}
                    actions={actions}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <aside className="flex min-h-[520px] flex-col rounded-lg border border-white/10 bg-[#191c1f]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-cyan-300" />
              <h2 className="text-sm font-semibold text-white">Holding area</h2>
            </div>
            <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-zinc-400">
              {holdingSessions.length} items
            </span>
          </div>

          <DropZone
            slotId={HOLDING_SLOT_ID}
            draggingId={draggingId}
            onDrop={handleDrop}
            className="flex flex-1 flex-col gap-3 p-3"
          >
            {holdingSessions.map((session) => (
              <HoldingCard
                key={session.id}
                session={session}
                setDraggingId={setDraggingId}
                actions={actions}
              />
            ))}
            {holdingSessions.length === 0 && (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed border-white/15 p-4 text-center text-sm text-zinc-500">
                <Sparkles className="mb-3 h-5 w-5 text-zinc-500" />
                Drop unassigned ideas here.
              </div>
            )}
            <Button
              type="button"
              variant="secondary"
              className="mt-auto w-full gap-2"
              onClick={() => actions.addSession(HOLDING_SLOT_ID)}
            >
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </DropZone>
        </aside>
      </section>

      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-4 pb-6 text-xs text-zinc-500 sm:px-6 lg:px-8">
        <span className="rounded-full border border-white/10 px-2 py-1">
          Storage: {mode}
        </span>
        {loading && <span>Loading Convex sessions...</span>}
        {mode === "Local" && (
          <span>Browser-local draft mode</span>
        )}
      </div>
    </main>
  );
}

function ScheduleSlotRows({
  slotId,
  timeBlock,
  label,
  sessions,
  draggingId,
  setDraggingId,
  onDrop,
  actions,
}: {
  slotId: string;
  timeBlock: string;
  label: string;
  sessions: PlannerSession[];
  draggingId: string | null;
  setDraggingId: (id: string | null) => void;
  onDrop: (slotId: string, sessionId: string) => void;
  actions: PlannerActions;
}) {
  return (
    <DropZone
      slotId={slotId}
      draggingId={draggingId}
      onDrop={onDrop}
      className="border-b border-white/10 last:border-b-0"
    >
      {sessions.length === 0 ? (
        <div className="grid grid-cols-[130px_minmax(180px,1.1fr)_minmax(150px,.8fr)_minmax(170px,.9fr)_minmax(280px,1.6fr)_48px] px-4 py-3">
          <TimeCell timeBlock={timeBlock} label={label} />
          <button
            type="button"
            className="col-span-5 rounded-md border border-dashed border-white/15 px-3 py-5 text-left text-sm text-zinc-500 hover:border-cyan-300/50 hover:text-zinc-200"
            onClick={() => actions.addSession(slotId)}
          >
            Drop a session here or click to add one.
          </button>
        </div>
      ) : (
        sessions.map((session, index) => (
          <SessionRow
            key={session.id}
            session={session}
            timeBlock={index === 0 ? timeBlock : ""}
            label={index === 0 ? label : ""}
            setDraggingId={setDraggingId}
            actions={actions}
          />
        ))
      )}
    </DropZone>
  );
}

function SessionRow({
  session,
  timeBlock,
  label,
  setDraggingId,
  actions,
}: {
  session: PlannerSession;
  timeBlock: string;
  label: string;
  setDraggingId: (id: string | null) => void;
  actions: PlannerActions;
}) {
  const missing = getMissingFields(session);

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", session.id);
        setDraggingId(session.id);
      }}
      onDragEnd={() => setDraggingId(null)}
      className="grid grid-cols-[130px_minmax(180px,1.1fr)_minmax(150px,.8fr)_minmax(170px,.9fr)_minmax(280px,1.6fr)_48px] gap-3 px-4 py-3 transition hover:bg-white/[0.025]"
    >
      <TimeCell timeBlock={timeBlock} label={label} />
      <EditableField
        session={session}
        field="sessionName"
        placeholder="Pending session"
        missing={missing}
        actions={actions}
        leadingDragHandle
      />
      <EditableField
        session={session}
        field="company"
        placeholder="Company TBD"
        missing={missing}
        actions={actions}
      />
      <EditableField
        session={session}
        field="speaker"
        placeholder="Speaker TBD"
        missing={missing}
        actions={actions}
      />
      <EditableField
        session={session}
        field="details"
        placeholder="Topic / details pending"
        missing={missing}
        actions={actions}
        multiline
      />
      <DeleteButton
        label={`Delete ${session.sessionName || "session"}`}
        onDelete={() => actions.deleteSession(session.id)}
      />
    </div>
  );
}

function HoldingCard({
  session,
  setDraggingId,
  actions,
}: {
  session: PlannerSession;
  setDraggingId: (id: string | null) => void;
  actions: PlannerActions;
}) {
  const missing = getMissingFields(session);

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", session.id);
        setDraggingId(session.id);
      }}
      onDragEnd={() => setDraggingId(null)}
      className="rounded-md border border-white/10 bg-[#22262a] p-3 shadow-sm"
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-zinc-400">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wide">
            Drag to schedule
          </span>
        </div>
        <DeleteButton
          label={`Delete ${session.sessionName || "holding item"}`}
          onDelete={() => actions.deleteSession(session.id)}
          compact
        />
      </div>
      <div className="space-y-2">
        <EditableField
          session={session}
          field="sessionName"
          placeholder="Pending session"
          missing={missing}
          actions={actions}
        />
        <div className="grid grid-cols-2 gap-2">
          <EditableField
            session={session}
            field="company"
            placeholder="Company TBD"
            missing={missing}
            actions={actions}
          />
          <EditableField
            session={session}
            field="speaker"
            placeholder="Speaker TBD"
            missing={missing}
            actions={actions}
          />
        </div>
        <EditableField
          session={session}
          field="details"
          placeholder="Topic / details pending"
          missing={missing}
          actions={actions}
          multiline
        />
      </div>
    </div>
  );
}

function EditableField({
  session,
  field,
  placeholder,
  missing,
  actions,
  leadingDragHandle,
  multiline,
}: {
  session: PlannerSession;
  field: "sessionName" | "company" | "speaker" | "details";
  placeholder: string;
  missing: MissingField[];
  actions: PlannerActions;
  leadingDragHandle?: boolean;
  multiline?: boolean;
}) {
  const hasGap = missing.includes(field);
  const value = session[field];

  return (
    <div>
      <div className="relative">
        {leadingDragHandle && (
          <GripVertical className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        )}
        {multiline ? (
          <textarea
            value={value}
            placeholder={placeholder}
            onChange={(event) =>
              actions.updateSession(session.id, { [field]: event.target.value })
            }
            className={[
              "min-h-20 w-full resize-y rounded-md border bg-[#111315] px-3 py-2 text-sm leading-5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-400/50",
              hasGap ? "border-amber-400/60" : "border-white/10",
            ].join(" ")}
          />
        ) : (
          <Input
            value={value}
            placeholder={placeholder}
            onChange={(event) =>
              actions.updateSession(session.id, { [field]: event.target.value })
            }
            className={[
              "h-10 border bg-[#111315] text-zinc-100 placeholder:text-zinc-600",
              leadingDragHandle ? "pl-8" : "",
              hasGap ? "border-amber-400/60" : "border-white/10",
            ].join(" ")}
          />
        )}
      </div>
      {hasGap && <GapBadge field={field} />}
    </div>
  );
}

function DeleteButton({
  label,
  onDelete,
  compact,
}: {
  label: string;
  onDelete: () => void;
  compact?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      className={[
        "border border-transparent text-zinc-500 hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-200",
        compact ? "h-7 w-7" : "mt-1 h-9 w-9",
      ].join(" ")}
      onClick={(event) => {
        event.stopPropagation();
        onDelete();
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function DropZone({
  slotId,
  draggingId,
  onDrop,
  className,
  children,
}: {
  slotId: string;
  draggingId: string | null;
  onDrop: (slotId: string, sessionId: string) => void;
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const sessionId = event.dataTransfer.getData("text/plain") || draggingId;
        if (sessionId) onDrop(slotId, sessionId);
      }}
      className={[
        className,
        draggingId ? "outline outline-1 outline-cyan-300/20" : "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function TimeCell({
  timeBlock,
  label,
}: {
  timeBlock: string;
  label: string;
}) {
  return (
    <div className="pr-3">
      <div className="font-mono text-sm text-zinc-100">{timeBlock}</div>
      <div className="mt-1 text-xs text-zinc-500">{label}</div>
    </div>
  );
}

function GapBadge({ field }: { field: MissingField }) {
  const labelByField: Record<MissingField, string> = {
    sessionName: "Session pending",
    company: "Company pending",
    speaker: "Speaker pending",
    details: "Topic pending",
  };

  return (
    <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-200">
      <AlertTriangle className="h-3 w-3" />
      {labelByField[field]}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-[#111315] px-4 py-3">
      <div className="font-mono text-2xl text-white">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </div>
    </div>
  );
}

function getSessionsSignature(sessions: PlannerSession[]) {
  return sessions
    .map(
      (session) =>
        `${session.id}:${session.slotId}:${session.order}:${session.sessionName}:${session.company}:${session.speaker}:${session.details}`,
    )
    .join("|");
}
