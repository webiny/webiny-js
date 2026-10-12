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

/**
 * What each stage does, in one sentence, for the stage header.
 *
 * Written from what the handlers actually do rather than from the stage's name, because the names are
 * the part an operator can already guess. The distinctions that matter at a gate are in here: that
 * Discover unions two sources, that Cluster groups by similarity rather than by exact match, that Plan
 * is where cost starts, and that Promote renames rather than overwrites.
 */
const STAGE_DESCRIPTIONS: Record<Stage, string> = {
    discover:
        "The run's URL list: the site's sitemap and a link crawl of it, unioned, then sampled across path groups down to the page cap.",
    capture:
        "Reads each URL in a browser and keeps what the later stages work from: a pruned element tree, full-page screenshots at desktop and narrow widths, and the raw DOM. A page that fails is recorded and skipped.",
    segment:
        "Cuts each captured page into candidate sections, detected as boundaries in the element tree and drawn as boxes over the page's screenshot.",
    cluster:
        "Groups sections that repeat across pages by similarity at a tunable threshold, so one header appearing on nine pages becomes one cluster rather than nine sections.",
    classify:
        "Gives each cluster a type, a name and a confidence. Below the confidence threshold a cluster is kept and marked unclassified rather than dropped.",
    plan: "Proposes each cluster's component contract — its props, the values observed for them, and the theme tokens they bind to. This is the stage where cost starts.",
    generate:
        "Writes each planned component's source, one task per component, and validates that its text is preserved, its contract is met and its tokens bind.",
    assemble:
        "For each page, the ordered list of component instances in document order, with the prop values each instance received.",
    promote:
        "Bundles the components you approve and holds them in this workspace's Library, ready to go into the site, renaming rather than overwriting when a name is already taken."
};

export interface StageMeta {
    stage: Stage;
    /** 1..9 */
    number: number;
    label: string;
    kind: StageKind;
    /** One sentence on what this stage does, shown under its name on the stage page. */
    description: string;
}

export const STAGE_META: StageMeta[] = STAGES.map(stage => ({
    stage,
    number: stageNumber(stage),
    label: STAGE_LABELS[stage],
    kind: stageKind(stage),
    description: STAGE_DESCRIPTIONS[stage]
}));

export const stageMeta = (stage: Stage): StageMeta => STAGE_META[stageNumber(stage) - 1];

/** The full sentence a stage header carries, per the stage's kind (spec §1). */
export const stageKindSentence = (kind: StageKind): string =>
    kind === "model"
        ? "Model-backed — a re-run with identical input is not identical."
        : "Deterministic — a re-run with identical input is identical.";
