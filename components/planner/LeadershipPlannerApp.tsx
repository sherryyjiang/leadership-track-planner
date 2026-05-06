"use client";

import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  Archive,
  GripVertical,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Redo2,
  RefreshCcw,
  Save,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HOLDING_SLOT_ID,
  createPlannerHistory,
  createDraftSession,
  getChangedSessionIds,
  getChangedSlotIds,
  getDeletedSessionIds,
  getMissingFields,
  getPlannerSnapshotSignature,
  isBreakSlot,
  moveSession as moveSessionLocal,
  pushPlannerHistory,
  redoPlannerHistory,
  replacePlannerHistoryPresent,
  scheduleSlots,
  seededSessions,
  sortScheduleSlots,
  sortSessions,
  undoPlannerHistory,
  updateScheduleSlot as updateScheduleSlotLocal,
  type MissingField,
  type PlannerSnapshot,
  type PlannerSession,
  type ScheduleSlot,
} from "@/lib/planner";

type PlannerActions = {
  addSession: (slotId: string) => void;
  deleteSession: (sessionId: string) => void;
  moveSession: (sessionId: string, slotId: string) => void;
  reset: () => void;
  save: () => Promise<void>;
  updateSlot: (
    slotId: string,
    patch: Partial<Pick<ScheduleSlot, "timeBlock" | "label">>,
  ) => void;
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
const SLOTS_STORAGE_KEY = "leadership-track-planner:slots";
const LAST_SAVED_KEY = "leadership-track-planner:last-saved-at";
const AUTOSAVE_DELAY_MS = 900;

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
        slots={scheduleSlots}
        loading={false}
        persistPlannerState={async () => undefined}
        resetPlannerState={async () => undefined}
        errorMessage="Convex is still syncing or the local dev server needs a restart. Refresh after Convex says functions are ready, or restart npm run dev."
      />
    );
  }
}

function ConvexPlanner() {
  const sessions = useQuery(api.sessions.list);
  const slots = useQuery(api.slots.list);
  const seedDefaults = useMutation(api.sessions.seedDefaults);
  const seedSlotDefaults = useMutation(api.slots.seedDefaults);
  const createSession = useMutation(api.sessions.create);
  const deleteSession = useMutation(api.sessions.remove);
  const updateSessionMutation = useMutation(api.sessions.update);
  const resetToSeed = useMutation(api.sessions.resetToSeed);
  const createSlot = useMutation(api.slots.create);
  const updateSlotMutation = useMutation(api.slots.update);
  const resetSlotsToSeed = useMutation(api.slots.resetToSeed);

  useEffect(() => {
    if (sessions && sessions.length === 0) {
      void seedDefaults();
    }
    if (slots && slots.length === 0) {
      void seedSlotDefaults();
    }
  }, [seedDefaults, seedSlotDefaults, sessions, slots]);

  const visibleSessions = sessions && sessions.length > 0 ? sessions : seededSessions;
  const visibleSlots = slots && slots.length > 0 ? slots : scheduleSlots;

  return (
    <PlannerBoard
      mode="Convex"
      sessions={sortSessions(visibleSessions, visibleSlots)}
      slots={sortScheduleSlots(visibleSlots)}
      loading={!sessions || !slots}
      persistPlannerState={async (draftSessions, draftSlots) => {
        const existingIds = new Set(sessions?.map((session) => session.id) ?? []);
        const draftIds = new Set(draftSessions.map((session) => session.id));
        const deletedIds =
          sessions
            ?.filter((session) => !draftIds.has(session.id))
            .map((session) => session.id) ?? [];

        const existingSlotIds = new Set(slots?.map((slot) => slot.id) ?? []);

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
            ...draftSlots.map((slot) => {
              if (!existingSlotIds.has(slot.id)) {
                return createSlot({
                  clientId: slot.id,
                  order: slot.order,
                  timeBlock: slot.timeBlock,
                  label: slot.label,
                  kind: slot.kind,
                });
              }

              return updateSlotMutation({
                clientId: slot.id,
                order: slot.order,
                timeBlock: slot.timeBlock,
                label: slot.label,
                kind: slot.kind,
              });
            }),
          ],
        );
      }}
      resetPlannerState={async () => {
        await Promise.all([resetToSeed(), resetSlotsToSeed()]);
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
  const [savedSlots, setSavedSlots] = useState<ScheduleSlot[]>(() => {
    if (typeof window === "undefined") return scheduleSlots;

    try {
      const stored = window.localStorage.getItem(SLOTS_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as ScheduleSlot[]) : scheduleSlots;
    } catch {
      return scheduleSlots;
    }
  });

  return (
    <PlannerBoard
      mode="Local"
      sessions={sortSessions(savedSessions, savedSlots)}
      slots={sortScheduleSlots(savedSlots)}
      loading={false}
      persistPlannerState={async (draftSessions, draftSlots) => {
        const sortedSessions = sortSessions(draftSessions, draftSlots);
        const sortedSlots = sortScheduleSlots(draftSlots);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedSessions));
        window.localStorage.setItem(SLOTS_STORAGE_KEY, JSON.stringify(sortedSlots));
        window.localStorage.setItem(LAST_SAVED_KEY, new Date().toISOString());
        setSavedSessions(sortedSessions);
        setSavedSlots(sortedSlots);
      }}
      resetPlannerState={async () => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seededSessions));
        window.localStorage.setItem(SLOTS_STORAGE_KEY, JSON.stringify(scheduleSlots));
        window.localStorage.setItem(LAST_SAVED_KEY, new Date().toISOString());
        setSavedSessions(seededSessions);
        setSavedSlots(scheduleSlots);
      }}
    />
  );
}

function PlannerBoard({
  mode,
  sessions,
  slots,
  loading,
  persistPlannerState,
  resetPlannerState,
  errorMessage,
}: {
  mode: "Convex" | "Local";
  sessions: PlannerSession[];
  slots: ScheduleSlot[];
  loading: boolean;
  persistPlannerState: (
    sessions: PlannerSession[],
    slots: ScheduleSlot[],
  ) => Promise<void>;
  resetPlannerState: () => Promise<void>;
  errorMessage?: string;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [history, setHistory] = useState(() =>
    createPlannerHistory({ sessions, slots }),
  );
  const [holdingCollapsed, setHoldingCollapsed] = useState(false);
  const [saveState, setSaveState] = useState<
    "saved" | "unsaved" | "saving" | "autosaving" | "error"
  >("saved");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const draftSessions = history.present.sessions;
  const draftSlots = history.present.slots;
  const savedSnapshot = useMemo<PlannerSnapshot>(
    () => ({ sessions, slots }),
    [sessions, slots],
  );
  const savedSnapshotSignature = useMemo(
    () => getPlannerSnapshotSignature(savedSnapshot),
    [savedSnapshot],
  );
  const draftSnapshotSignature = useMemo(
    () => getPlannerSnapshotSignature(history.present),
    [history.present],
  );
  const latestDraftSignatureRef = useRef(draftSnapshotSignature);
  const lastWrittenSnapshotSignatureRef = useRef<string | null>(null);
  const changedIds = useMemo(
    () => getChangedSessionIds(sessions, draftSessions),
    [sessions, draftSessions],
  );
  const changedSlotIds = useMemo(
    () => getChangedSlotIds(slots, draftSlots),
    [slots, draftSlots],
  );
  const deletedIds = useMemo(
    () => getDeletedSessionIds(sessions, draftSessions),
    [sessions, draftSessions],
  );
  const unsavedChangeCount =
    changedIds.length + deletedIds.length + changedSlotIds.length;
  const hasUnsavedChanges = unsavedChangeCount > 0;
  const holdingSessions = draftSessions.filter(
    (session) => session.slotId === HOLDING_SLOT_ID,
  );
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  useEffect(() => {
    latestDraftSignatureRef.current = draftSnapshotSignature;
  }, [draftSnapshotSignature]);

  useEffect(() => {
    setHistory((current) => {
      const currentSignature = getPlannerSnapshotSignature(current.present);
      if (currentSignature === savedSnapshotSignature) return current;
      if (lastWrittenSnapshotSignatureRef.current === currentSignature) {
        return current;
      }
      if (saveState !== "saved") return current;

      return createPlannerHistory(savedSnapshot);
    });
  }, [savedSnapshot, savedSnapshotSignature, saveState]);

  const commitSnapshot = useCallback(
    (createNextSnapshot: (current: PlannerSnapshot) => PlannerSnapshot) => {
      setHistory((current) =>
        pushPlannerHistory(current, createNextSnapshot(current.present)),
      );
      setSaveState("unsaved");
    },
    [],
  );

  const persistCurrentSnapshot = useCallback(
    async (trigger: "manual" | "autosave") => {
      if (!hasUnsavedChanges) return;

      const sortedSlots = sortScheduleSlots(draftSlots);
      const sortedDraft = sortSessions(draftSessions, sortedSlots);
      const nextSnapshot = { sessions: sortedDraft, slots: sortedSlots };
      const targetSignature = getPlannerSnapshotSignature(nextSnapshot);

      setSaveState(trigger === "autosave" ? "autosaving" : "saving");
      try {
        await persistPlannerState(sortedDraft, sortedSlots);
        lastWrittenSnapshotSignatureRef.current = targetSignature;
        setHistory((current) => {
          if (getPlannerSnapshotSignature(current.present) !== targetSignature) {
            return current;
          }

          return replacePlannerHistoryPresent(current, nextSnapshot);
        });
        setLastSavedAt(new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }));
        setSaveState(
          latestDraftSignatureRef.current === targetSignature
            ? "saved"
            : "unsaved",
        );
      } catch {
        setSaveState("error");
      }
    },
    [draftSessions, draftSlots, hasUnsavedChanges, persistPlannerState],
  );

  useEffect(() => {
    if (!hasUnsavedChanges || saveState !== "unsaved" || loading) return;

    const timeoutId = window.setTimeout(() => {
      void persistCurrentSnapshot("autosave");
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [hasUnsavedChanges, loading, persistCurrentSnapshot, saveState]);

  const actions: PlannerActions = {
    addSession: (slotId) => {
      commitSnapshot((current) => {
        const draft = createDraftSession(slotId);
        return {
          ...current,
          sessions: [
            ...current.sessions,
            {
              ...draft,
              order: current.sessions.filter(
                (session) => session.slotId === slotId,
              ).length,
            },
          ],
        };
      });
    },
    deleteSession: (sessionId) => {
      commitSnapshot((current) => ({
        ...current,
        sessions: current.sessions.filter((session) => session.id !== sessionId),
      }));
    },
    moveSession: (sessionId, slotId) => {
      commitSnapshot((current) => ({
        ...current,
        sessions: moveSessionLocal(current.sessions, sessionId, slotId),
      }));
    },
    reset: async () => {
      setSaveState("saving");
      try {
        await resetPlannerState();
        const seedSnapshot = {
          sessions: seededSessions,
          slots: scheduleSlots,
        };
        setHistory(createPlannerHistory(seedSnapshot));
        lastWrittenSnapshotSignatureRef.current =
          getPlannerSnapshotSignature(seedSnapshot);
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
      await persistCurrentSnapshot("manual");
    },
    updateSession: (sessionId, patch) => {
      commitSnapshot((current) => ({
        ...current,
        sessions: current.sessions.map((session) =>
          session.id === sessionId ? { ...session, ...patch } : session,
        ),
      }));
    },
    updateSlot: (slotId, patch) => {
      commitSnapshot((current) => ({
        ...current,
        slots: updateScheduleSlotLocal(current.slots, slotId, patch),
      }));
    },
  };

  function undo() {
    if (!canUndo) return;
    setHistory((current) => undoPlannerHistory(current));
    setSaveState("unsaved");
  }

  function redo() {
    if (!canRedo) return;
    setHistory((current) => redoPlannerHistory(current));
    setSaveState("unsaved");
  }

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
                    saveState === "autosaving" ? "bg-cyan-300" : "",
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
                {saveState === "autosaving" && "Auto-saving..."}
                {saveState === "error" && "Save failed"}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Undo"
                title="Undo"
                className="border-white/15 bg-transparent text-zinc-100 hover:bg-white/10 hover:text-white disabled:opacity-40"
                disabled={!canUndo || loading}
                onClick={undo}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Redo"
                title="Redo"
                className="border-white/15 bg-transparent text-zinc-100 hover:bg-white/10 hover:text-white disabled:opacity-40"
                disabled={!canRedo || loading}
                onClick={redo}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50"
                disabled={
                  !hasUnsavedChanges ||
                  saveState === "saving" ||
                  saveState === "autosaving" ||
                  loading
                }
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

          {errorMessage && (
            <div className="rounded-md border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {errorMessage}
            </div>
          )}
        </div>
      </section>

      <section
        className={[
          "mx-auto grid max-w-[1500px] gap-4 px-4 py-4 sm:px-6 lg:px-8",
          holdingCollapsed
            ? "lg:grid-cols-[minmax(0,1fr)_64px]"
            : "lg:grid-cols-[minmax(0,1fr)_360px]",
        ].join(" ")}
      >
        <div className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-[#191c1f]">
          <div className="overflow-x-auto">
            <div className="min-w-[920px]">
              <div className="grid grid-cols-[150px_minmax(180px,1.1fr)_minmax(150px,.8fr)_minmax(170px,.9fr)_minmax(280px,1.6fr)_48px] border-b border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <div>Time block</div>
                <div>Session name</div>
                <div>Company</div>
                <div>Speaker</div>
                <div>Details</div>
                <div />
              </div>
              {draftSlots.map((slot) => {
                const slotSessions = draftSessions.filter(
                  (session) => session.slotId === slot.id,
                );

                return (
                  <ScheduleSlotRows
                    key={slot.id}
                    slot={slot}
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

        <aside
          className={[
            "flex min-h-[520px] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#191c1f] transition-[width]",
            holdingCollapsed ? "items-center" : "",
          ].join(" ")}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            {holdingCollapsed ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Expand holding area"
                title="Expand holding area"
                className="h-9 w-9 text-zinc-300 hover:bg-white/10 hover:text-white"
                onClick={() => setHoldingCollapsed(false)}
              >
                <PanelRightOpen className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-cyan-300" />
                  <h2 className="text-sm font-semibold text-white">
                    Holding area
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-zinc-400">
                    {holdingSessions.length} items
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Collapse holding area"
                    title="Collapse holding area"
                    className="h-8 w-8 text-zinc-400 hover:bg-white/10 hover:text-white"
                    onClick={() => setHoldingCollapsed(true)}
                  >
                    <PanelRightClose className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {holdingCollapsed ? (
            <div className="flex flex-1 flex-col items-center gap-3 p-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-xs text-zinc-400"
                title={`${holdingSessions.length} holding items`}
              >
                {holdingSessions.length}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label="Add holding item"
                title="Add holding item"
                className="mt-auto"
                onClick={() => actions.addSession(HOLDING_SLOT_ID)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
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
          )}
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
  slot,
  sessions,
  draggingId,
  setDraggingId,
  onDrop,
  actions,
}: {
  slot: ScheduleSlot;
  sessions: PlannerSession[];
  draggingId: string | null;
  setDraggingId: (id: string | null) => void;
  onDrop: (slotId: string, sessionId: string) => void;
  actions: PlannerActions;
}) {
  const isBreak = isBreakSlot(slot);

  return (
    <DropZone
      slotId={slot.id}
      draggingId={draggingId}
      onDrop={onDrop}
      className={[
        "border-b border-white/10 last:border-b-0",
        isBreak ? "bg-amber-300/[0.045]" : "",
      ].join(" ")}
    >
      {sessions.length === 0 ? (
        <div className="grid grid-cols-[150px_minmax(180px,1.1fr)_minmax(150px,.8fr)_minmax(170px,.9fr)_minmax(280px,1.6fr)_48px] px-4 py-3">
          <TimeCell slot={slot} actions={actions} />
          <button
            type="button"
            className="col-span-5 rounded-md border border-dashed border-white/15 px-3 py-5 text-left text-sm text-zinc-500 hover:border-cyan-300/50 hover:text-zinc-200"
            onClick={() => actions.addSession(slot.id)}
          >
            Drop a session here or click to add one.
          </button>
        </div>
      ) : (
        sessions.map((session, index) => (
          <SessionRow
            key={session.id}
            slot={slot}
            session={session}
            showTimeCell={index === 0}
            setDraggingId={setDraggingId}
            actions={actions}
          />
        ))
      )}
    </DropZone>
  );
}

function SessionRow({
  slot,
  session,
  showTimeCell,
  setDraggingId,
  actions,
}: {
  slot: ScheduleSlot;
  session: PlannerSession;
  showTimeCell: boolean;
  setDraggingId: (id: string | null) => void;
  actions: PlannerActions;
}) {
  const missing = getMissingFields(session);
  const isBreak = isBreakSlot(slot);

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", session.id);
        setDraggingId(session.id);
      }}
      onDragEnd={() => setDraggingId(null)}
      className={[
        "grid grid-cols-[150px_minmax(180px,1.1fr)_minmax(150px,.8fr)_minmax(170px,.9fr)_minmax(280px,1.6fr)_48px] gap-3 px-4 py-3 transition hover:bg-white/[0.025]",
        isBreak ? "border-l-2 border-l-amber-300/60 bg-amber-300/[0.035]" : "",
      ].join(" ")}
    >
      {showTimeCell ? <TimeCell slot={slot} actions={actions} /> : <div />}
      {isBreak ? (
        <div className="col-span-4">
          <EditableField
            session={session}
            field="sessionName"
            placeholder="Break"
            missing={missing}
            actions={actions}
            leadingDragHandle
            multiline
          />
        </div>
      ) : (
        <>
          <EditableField
            session={session}
            field="sessionName"
            placeholder="Pending session"
            missing={missing}
            actions={actions}
            leadingDragHandle
            multiline
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
        </>
      )}
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
          multiline
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
          <GripVertical
            className={[
              "absolute left-2 h-4 w-4 text-zinc-500",
              multiline ? "top-3" : "top-1/2 -translate-y-1/2",
            ].join(" ")}
          />
        )}
        {multiline ? (
          <textarea
            value={value}
            placeholder={placeholder}
            onChange={(event) =>
              actions.updateSession(session.id, { [field]: event.target.value })
            }
            className={[
              "w-full resize-y rounded-md border bg-[#111315] px-3 py-2 text-sm leading-5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-400/50",
              field === "details" ? "min-h-20" : "min-h-16",
              leadingDragHandle ? "pl-8" : "",
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

function TimeCell({ slot, actions }: { slot: ScheduleSlot; actions: PlannerActions }) {
  const isBreak = isBreakSlot(slot);

  return (
    <div className="space-y-1 pr-3">
      <Input
        value={slot.timeBlock}
        aria-label={`Time block for ${slot.label}`}
        onChange={(event) =>
          actions.updateSlot(slot.id, { timeBlock: event.target.value })
        }
        className={[
          "h-8 border bg-[#111315] px-2 font-mono text-sm text-zinc-100 placeholder:text-zinc-600",
          isBreak ? "border-amber-300/30" : "border-white/10",
        ].join(" ")}
      />
      <Input
        value={slot.label}
        aria-label={`Slot label for ${slot.timeBlock}`}
        onChange={(event) =>
          actions.updateSlot(slot.id, { label: event.target.value })
        }
        className={[
          "h-7 border bg-transparent px-2 text-xs text-zinc-400 placeholder:text-zinc-600",
          isBreak ? "border-amber-300/20 text-amber-200" : "border-white/10",
        ].join(" ")}
      />
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
