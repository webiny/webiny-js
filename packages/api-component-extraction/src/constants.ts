/**
 * The nine-stage pipeline, in order. Stages 1–4 and 8 are deterministic; 5, 6 and 7 are model-backed.
 * The order is load-bearing: staleness marches downstream from a re-run stage, and the gate advances
 * a run one stage at a time.
 */
export const STAGES = [
    "discover",
    "capture",
    "segment",
    "cluster",
    "classify",
    "plan",
    "generate",
    "assemble",
    "promote"
] as const;

export type Stage = (typeof STAGES)[number];

/** The index of a stage in the pipeline, or -1 if it is not a stage. */
export const stageIndex = (stage: Stage): number => STAGES.indexOf(stage);

/** Every stage strictly after the given one — the set a re-run marks stale. */
export const stagesAfter = (stage: Stage): Stage[] => STAGES.slice(stageIndex(stage) + 1);

/** The stage immediately before the given one, or null for the first stage. */
export const previousStage = (stage: Stage): Stage | null => {
    const index = stageIndex(stage);
    return index > 0 ? STAGES[index - 1] : null;
};

// Private CMS model ids. Private means invisible to the CMS GraphQL endpoint and UI; this feature's
// own schema is the only way in — the same mechanism the Theme app uses for `wbyTheme`.
export const JOB_MODEL_ID = "wbyExtractionJob";
export const RUN_MODEL_ID = "wbyExtractionRun";
export const OVERRIDE_MODEL_ID = "wbyExtractionOverride";
// One entry per model call (Classify/Plan/Generate). A private CMS model rather than the key-value
// store because the KV store cannot list by prefix, and the token panel lists a run's calls. The
// per-stage aggregate is written once onto the Run's stage ledger by the runner when the stage closes.
export const MODEL_CALL_MODEL_ID = "wbyExtractionModelCall";

// Tenant-scoped key-value keys. Scoping comes free from `KeyValueStore`; one tenant's run lock must
// not block another's.
export const RUN_LOCK_KEY_PREFIX = "componentExtraction:run:lock:";

/** Per-job run lock key. One in-flight run per job. */
export const runLockKey = (jobId: string): string => `${RUN_LOCK_KEY_PREFIX}${jobId}`;

// Phase-1 page-cap bounds (decision 3): configurable per job, default 40, hard maximum 150.
export const DEFAULT_PAGE_CAP = 40;
export const MAX_PAGE_CAP = 150;

// The auth-gated run-image delivery route (W7.2). Serves derived images (screenshots, crops,
// thumbnails) from raw S3 for the visibility screens, gated on the feature permission and scoped to a
// tenant's run. `:ref` is passed as a query parameter (`?ref=`) because blob keys contain slashes.
export const RUN_IMAGE_ROUTE = "/_webiny/component-extraction/run/:runId/image";
// Derived-image keys include the stage version, so a stored object never changes under the same key.
export const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * The background-task id for a stage — one TaskDefinition per stage. camelCase, as the task framework
 * requires (e.g. `componentExtractionDiscover`).
 */
export const stageTaskId = (stage: Stage): string => `componentExtraction${capitalize(stage)}`;

/**
 * Deterministic artifact key. Includes the run, the stage and the stage version, so re-running a stage
 * writes to a fresh key (its version bumped) and a stale downstream artifact never collides with a new
 * one. `name` distinguishes a stage's multiple artifacts (e.g. a page's pruned tree vs its raw DOM).
 */
export const stageArtifactKey = (
    runId: string,
    stage: Stage,
    stageVersion: number,
    name: string
): string => `componentExtraction:artifact:${runId}:${stage}:v${stageVersion}:${name}`;
