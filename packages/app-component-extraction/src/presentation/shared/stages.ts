import { STAGES, STAGE_LABELS, type Stage } from "~/constants.js";

/**
 * Shared stage metadata for the W9 screens — the pipeline's identity in one place: each stage's number,
 * label and kind. The stage rail, the extractions list, the stage header and the run inspector all read
 * from here so the pipeline is described once.
 */

export type StageKind = "deterministic" | "model";

/** The three model-backed stages (Classify, Plan, Generate); every other stage is deterministic. */
const MODEL_STAGES: ReadonlySet<Stage> = new Set<Stage>(["classify", "plan", "generate"]);

export const stageKind = (stage: Stage): StageKind =>
    MODEL_STAGES.has(stage) ? "model" : "deterministic";

/** The stage's 1-based position in the pipeline (Discover = 1 … Promote = 9). */
export const stageNumber = (stage: Stage): number => STAGES.indexOf(stage) + 1;

export interface StageMeta {
    stage: Stage;
    /** 1..9 */
    number: number;
    label: string;
    kind: StageKind;
}

export const STAGE_META: StageMeta[] = STAGES.map(stage => ({
    stage,
    number: stageNumber(stage),
    label: STAGE_LABELS[stage],
    kind: stageKind(stage)
}));

export const stageMeta = (stage: Stage): StageMeta => STAGE_META[stageNumber(stage) - 1];

/** The full sentence a stage header carries, per the stage's kind (spec §1). */
export const stageKindSentence = (kind: StageKind): string =>
    kind === "model"
        ? "Model-backed — a re-run with identical input is not identical."
        : "Deterministic — a re-run with identical input is identical.";
