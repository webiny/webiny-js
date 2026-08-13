import { STAGES, stagesAfter, type Stage } from "~/constants.js";
import type { StageLedgerEntry, StageModelUsage } from "./types.js";

/**
 * Pure transforms over a run's stage ledger. Kept pure and separate from the repository so the
 * staleness rule — the load-bearing part of W2 — is unit-testable without a database.
 */

/** A fresh ledger: every stage pending, at version 0, with no artifacts. */
export const initLedger = (): StageLedgerEntry[] =>
    STAGES.map(stage => ({
        stage,
        status: "pending",
        stageVersion: 0,
        rev: 0,
        artifacts: {},
        startedOn: null,
        finishedOn: null,
        error: null,
        taskId: null,
        modelUsage: null
    }));

/** The next monotonic revision for an entry (defaulting a legacy entry with no `rev` to 0). */
const nextRev = (entry: StageLedgerEntry): number => (entry.rev ?? 0) + 1;

const patch = (
    ledger: StageLedgerEntry[],
    stage: Stage,
    change: (entry: StageLedgerEntry) => StageLedgerEntry
): StageLedgerEntry[] =>
    ledger.map(entry =>
        entry.stage === stage ? { ...change(entry), rev: nextRev(entry) } : entry
    );

/** Stamp the background task id of the stage's latest run onto its entry (for log deep-linking). */
export const withStageTaskId = (
    ledger: StageLedgerEntry[],
    stage: Stage,
    taskId: string
): StageLedgerEntry[] => patch(ledger, stage, entry => ({ ...entry, taskId }));

/** Stamp a model-backed stage's usage aggregate onto its entry (written once, at stage close). */
export const withStageModelUsage = (
    ledger: StageLedgerEntry[],
    stage: Stage,
    modelUsage: StageModelUsage
): StageLedgerEntry[] => patch(ledger, stage, entry => ({ ...entry, modelUsage }));

/** Mark a stage as started. Clears any prior error so a re-run of a failed stage reads cleanly. */
export const markStageRunning = (
    ledger: StageLedgerEntry[],
    stage: Stage,
    now: string
): StageLedgerEntry[] =>
    patch(ledger, stage, entry => ({
        ...entry,
        status: "running",
        startedOn: now,
        finishedOn: null,
        error: null
    }));

/**
 * Mark a stage done and cascade staleness downstream.
 *
 * The stage's `stageVersion` bumps (it produced new output), and every downstream stage that had
 * output becomes `stale` — its artifact was derived from an older upstream version. A downstream stage
 * that never ran stays `pending`; there is nothing to invalidate.
 */
export const markStageDone = (
    ledger: StageLedgerEntry[],
    stage: Stage,
    artifacts: Record<string, string>,
    now: string
): StageLedgerEntry[] => {
    const downstream = new Set<Stage>(stagesAfter(stage));

    return ledger.map(entry => {
        if (entry.stage === stage) {
            return {
                ...entry,
                status: "done",
                finishedOn: now,
                error: null,
                artifacts,
                stageVersion: entry.stageVersion + 1,
                rev: nextRev(entry)
            };
        }
        if (downstream.has(entry.stage) && entry.status !== "pending") {
            return { ...entry, status: "stale", rev: nextRev(entry) };
        }
        return entry;
    });
};

/**
 * Mark a stage and everything after it stale — for editing an upstream stage's output (e.g. the Discover
 * URL list) without re-running it. A stage that never ran stays pending; there is nothing to invalidate.
 */
export const markStaleFrom = (ledger: StageLedgerEntry[], stage: Stage): StageLedgerEntry[] => {
    const affected = new Set<Stage>([stage, ...stagesAfter(stage)]);
    return ledger.map(entry =>
        affected.has(entry.stage) && entry.status !== "pending"
            ? { ...entry, status: "stale", rev: nextRev(entry) }
            : entry
    );
};

/** Mark a stage failed. No version bump and no cascade — a failed stage produced no new output. */
export const markStageFailed = (
    ledger: StageLedgerEntry[],
    stage: Stage,
    error: string,
    now: string
): StageLedgerEntry[] =>
    patch(ledger, stage, entry => ({
        ...entry,
        status: "failed",
        finishedOn: now,
        error
    }));

/** The ledger entry for a stage, or undefined if the ledger predates it. */
export const stageEntry = (
    ledger: StageLedgerEntry[],
    stage: Stage
): StageLedgerEntry | undefined => ledger.find(entry => entry.stage === stage);

/**
 * Merge a freshly-read stored ledger with an incoming one, keeping the more-advanced entry per stage —
 * the one with the higher monotonic `rev`.
 *
 * The nine-stage ledger is a single JSON blob written read-modify-write, so a writer holding a stale
 * copy — most often a retrying/zombie stage task that read the run before later stages ran — can
 * otherwise clobber a stage back to an earlier state, silently undoing real work. Every transition bumps
 * `rev`, so a stale writer's untouched stages carry a strictly lower `rev` than what is stored and lose
 * the merge — regressions are dropped while every legitimate forward transition (which bumped `rev`)
 * still wins. Unlike `stageVersion`, `rev` also orders the `running` state (which shares a version with
 * the `pending`/`done` it came from), so a running stage cannot be knocked back either. Applied at the
 * repository so it guards every writer, not just the stage runner. `rev` defaults to 0 for legacy
 * entries written before this field existed.
 */
export const mergeLedgers = (
    stored: StageLedgerEntry[],
    incoming: StageLedgerEntry[]
): StageLedgerEntry[] => {
    const storedByStage = new Map(stored.map(entry => [entry.stage, entry]));
    return incoming.map(entry => {
        const current = storedByStage.get(entry.stage);
        return current && (current.rev ?? 0) > (entry.rev ?? 0) ? current : entry;
    });
};
