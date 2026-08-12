import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Stage } from "~/constants.js";
import type { Job, Run, RunCounts } from "./types.js";
import type { ExtractionError } from "./errors.js";

/**
 * The seam a stage plugs into (W3 topology; W4 supplies the nine handlers).
 *
 * A stage task is thin: the shared `StageTaskRunner` handles the ledger, progress, locking and failure
 * accounting, and calls the one `StageHandler` whose `stage` matches. The handler does the actual work
 * over the `StageContext` and returns a `StageOutcome` — the artifact refs it produced, count deltas,
 * and any per-item degradations.
 */

/** The task logger's shape (`controller.logger`), narrowed to what a stage needs. */
export interface StageLog {
    info(params: { message: string; data?: Record<string, unknown> }): Promise<void>;
    error(params: {
        message: string;
        error?: unknown;
        data?: Record<string, unknown>;
    }): Promise<void>;
}

/**
 * Small JSON stage artifacts, keyed deterministically on the tenant KeyValueStore. Large binaries — a
 * full-page screenshot, a compressed raw DOM — are written to S3 by W4 handlers via `@webiny/site-capture`
 * and referenced by key here; DynamoDB has no business holding those bytes.
 */
export interface IStageArtifactStore {
    putJson(key: string, value: unknown): Promise<Result<void, ExtractionError>>;
    getJson<T>(key: string): Promise<Result<T | null, ExtractionError>>;
}

export const StageArtifactStore = createAbstraction<IStageArtifactStore>(
    "ComponentExtraction/StageArtifactStore"
);
export namespace StageArtifactStore {
    export type Interface = IStageArtifactStore;
}

export interface StageOutcome {
    /** Artifact references this stage produced (name -> key), recorded on the ledger for handoff. */
    artifacts: Record<string, string>;
    /** Count deltas merged into the run (pages, sections, clusters, components). */
    counts?: Partial<RunCounts>;
    /** Per-item failures that degraded the stage without failing it. */
    degraded?: string[];
}

export interface StageContext {
    run: Run;
    job: Job;
    /** The prior stage's artifact refs (name -> key), for handoff. Empty for the first stage. */
    upstream: Record<string, string>;
    /** Deterministic key for one of this stage's artifacts — includes run, stage and target version. */
    artifactKey(name: string): string;
    store: IStageArtifactStore;
    log: StageLog;
}

export interface IStageHandler {
    readonly stage: Stage;
    execute(context: StageContext): Promise<Result<StageOutcome, ExtractionError>>;
}

export const StageHandler = createAbstraction<IStageHandler>("ComponentExtraction/StageHandler");
export namespace StageHandler {
    export type Interface = IStageHandler;
}

// Websocket action names, namespaced to this feature (the admin subscribes to these in W6).
export const STAGE_PROGRESS_ACTION = "componentExtraction.stage.progress";
export const STAGE_DONE_ACTION = "componentExtraction.stage.done";
export const STAGE_FAILED_ACTION = "componentExtraction.stage.failed";

export interface StageProgressPayload {
    runId: string;
    jobId: string;
    stage: Stage;
    status: string;
    message?: string;
    degraded?: string[];
    [key: string]: unknown;
}
