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
        artifacts: {},
        startedOn: null,
        finishedOn: null,
        error: null,
        taskId: null,
        modelUsage: null
    }));

const patch = (
    ledger: StageLedgerEntry[],
    stage: Stage,
    change: (entry: StageLedgerEntry) => StageLedgerEntry
): StageLedgerEntry[] => ledger.map(entry => (entry.stage === stage ? change(entry) : entry));

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
                stageVersion: entry.stageVersion + 1
            };
        }
        if (downstream.has(entry.stage) && entry.status !== "pending") {
            return { ...entry, status: "stale" };
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
            ? { ...entry, status: "stale" }
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
