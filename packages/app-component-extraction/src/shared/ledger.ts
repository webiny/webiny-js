import { ProgressItemState } from "@webiny/admin-ui";
import { STAGES, STAGE_LABELS, type Stage } from "~/constants.js";
import type { RunDto, StageDto } from "./types.js";

const isStage = (value: string): value is Stage => (STAGES as readonly string[]).includes(value);

export const stageEntry = (run: RunDto, stage: Stage): StageDto | undefined =>
    run.stages.find(entry => entry.stage === stage);

/**
 * The stage the run is "at": the running one, else the first that has not completed. `null` once every
 * stage is done.
 */
export const currentStage = (run: RunDto): Stage | null => {
    const running = STAGES.find(stage => stageEntry(run, stage)?.status === "running");
    if (running) {
        return running;
    }
    const pending = STAGES.find(stage => {
        const status = stageEntry(run, stage)?.status;
        return status !== "done";
    });
    return pending ?? null;
};

/**
 * The stage whose "Run" action is enabled: the first not-yet-done stage whose predecessor is done (or
 * that is the first stage). `null` when a stage is already running or the run is complete.
 */
export const nextRunnableStage = (run: RunDto): Stage | null => {
    if (STAGES.some(stage => stageEntry(run, stage)?.status === "running")) {
        return null;
    }
    for (let index = 0; index < STAGES.length; index++) {
        const stage = STAGES[index];
        const status = stageEntry(run, stage)?.status;
        if (status === "done") {
            continue;
        }
        const previous = index > 0 ? STAGES[index - 1] : null;
        const previousDone = !previous || stageEntry(run, previous)?.status === "done";
        return previousDone ? stage : null;
    }
    return null;
};

/** A short human label of where a run stands, for the extractions list. */
export const runStageLabel = (run: RunDto | null): string => {
    if (!run) {
        return "—";
    }
    const stage = currentStage(run);
    if (!stage) {
        return "Complete";
    }
    return isStage(stage) ? STAGE_LABELS[stage] : stage;
};

/** Maps a ledger status onto the SteppedProgress item state used by the run view. */
export const progressStateOf = (
    status: string | undefined
): { state: ProgressItemState; errored: boolean } => {
    switch (status) {
        case "done":
            return { state: ProgressItemState.COMPLETED_AFFIRMATIVE, errored: false };
        case "running":
            return { state: ProgressItemState.IN_PROGRESS, errored: false };
        case "failed":
            return { state: ProgressItemState.IDLE, errored: true };
        case "stale":
            return { state: ProgressItemState.IDLE, errored: false };
        default:
            return { state: ProgressItemState.IDLE, errored: false };
    }
};
