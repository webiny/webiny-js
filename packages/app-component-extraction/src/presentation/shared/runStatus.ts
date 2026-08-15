import { STAGES, type Stage } from "~/constants.js";
import { stageEntry, nextRunnableStage } from "~/shared/ledger.js";
import type { RunDto } from "~/shared/types.js";
import { toDisplayStatus, type DisplayStatus } from "./status.js";

/**
 * Run → display-status derivations shared by every W9 surface that reflects a run (the extractions list
 * pips and status cell, the stage rail, the current-run panel). The prototype's data model notes that a
 * job's whole visual state follows from its nine per-stage statuses, so these compute exactly that.
 */

/**
 * The gate stage a run is paused at, or null. A run is "paused here" when nothing is running or failed and
 * a stage is ready to run but hasn't — the pipeline has stopped for the operator at that gate.
 */
export const pausedGateStage = (run: RunDto): Stage | null => {
    const busyOrBroken = run.stages.some(
        entry =>
            entry.status === "running" || entry.status === "starting" || entry.status === "failed"
    );
    if (busyOrBroken) {
        return null;
    }
    return nextRunnableStage(run);
};

/** The nine per-stage display statuses in pipeline order (Discover … Promote). */
export const runStageStatuses = (run: RunDto | null): DisplayStatus[] => {
    if (!run) {
        return STAGES.map(() => "not-started");
    }
    const gate = pausedGateStage(run);
    return STAGES.map(stage =>
        toDisplayStatus(stageEntry(run, stage)?.status, { pausedGate: stage === gate })
    );
};

/** The single status that summarises a run, for the list's Status cell and run history. */
export const runOverallStatus = (run: RunDto | null): DisplayStatus => {
    if (!run) {
        return "not-started";
    }
    if (run.stages.some(entry => entry.status === "running" || entry.status === "starting")) {
        return "running";
    }
    if (run.stages.some(entry => entry.status === "failed")) {
        return "failed";
    }
    if (pausedGateStage(run)) {
        return "paused";
    }
    if (STAGES.every(stage => stageEntry(run, stage)?.status === "done")) {
        return "complete";
    }
    if (run.stages.some(entry => entry.status === "stale")) {
        return "stale";
    }
    return "not-started";
};
