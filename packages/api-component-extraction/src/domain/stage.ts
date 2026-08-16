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

/**
 * Large binary artifacts — full-page screenshots, compressed raw DOM — in raw S3 under the feature
 * prefix, following the `S3ScreenshotStore` pattern. Keys are relative to the prefix; `put` returns the
 * full key to reference the blob by.
 */
export interface IBlobStore {
    put(
        key: string,
        bytes: Uint8Array,
        contentType: string
    ): Promise<Result<string, ExtractionError>>;
    get(ref: string): Promise<Result<Uint8Array, ExtractionError>>;
    /** Fetch bytes plus the stored content type, for serving a blob over the run-image route. */
    getObject(
        ref: string
    ): Promise<Result<{ bytes: Uint8Array; contentType: string }, ExtractionError>>;
    /** Remove every blob written under a run's prefix, when the run's working data is no longer needed. */
    deleteAll(runId: string): Promise<Result<void, ExtractionError>>;
}

export const BlobStore = createAbstraction<IBlobStore>("ComponentExtraction/BlobStore");
export namespace BlobStore {
    export type Interface = IBlobStore;
}

export interface StageOutcome {
    /** Artifact references this stage produced (name -> key), recorded on the ledger for handoff. */
    artifacts: Record<string, string>;
    /** Count deltas merged into the run (pages, sections, clusters, components). */
    counts?: Partial<RunCounts>;
    /** Per-item failures that degraded the stage without failing it. */
    degraded?: string[];
    /**
     * When true, the stage has more work and has checkpointed its progress; the runner re-invokes it
     * (a task continuation) rather than finishing. A resumable stage sets this on yielding near the
     * Lambda timeout; `counts` may carry partial deltas to persist between iterations.
     */
    more?: boolean;
    /**
     * Seconds to wait before the next continuation (defaults to 1). A coordinator that yields to poll
     * child tasks sets this higher so it does not hot-loop re-invocations while children work.
     */
    waitSeconds?: number;
}

/** A live progress update from a stage: a human message plus an optional current/total for a bar. */
export interface StageProgressUpdate {
    message: string;
    current?: number;
    total?: number;
    data?: Record<string, unknown>;
}

export interface StageContext {
    run: Run;
    job: Job;
    /** The version this run of the stage is producing — for model-call accounting and derived-image keys. */
    stageVersion: number;
    /** The prior stage's artifact refs (name -> key), for handoff. Empty for the first stage. */
    upstream: Record<string, string>;
    /** Deterministic key for one of this stage's artifacts — includes run, stage and target version. */
    artifactKey(name: string): string;
    /** Small JSON stage artifacts (KV). */
    store: IStageArtifactStore;
    /** Large binary artifacts (S3) — screenshots, compressed DOM. */
    blobs: IBlobStore;
    log: StageLog;
    /**
     * Report incremental progress. One call writes a database log (the Background Tasks viewer trail),
     * updates the task output (a live counter), and emits a `stage.progress` websocket the admin run
     * view renders live. Best-effort: it never throws, so a hot-loop progress call can't fail a stage.
     */
    progress(update: StageProgressUpdate): Promise<void>;
    /**
     * True when the task is within `safetyMarginSeconds` of its Lambda timeout. A resumable stage
     * checkpoints and returns `{ more: true }` when this trips, so the runner continues it in a fresh
     * invocation. Pass a margin larger than one item's worst-case duration so an item never straddles
     * the timeout.
     */
    isCloseToTimeout(safetyMarginSeconds?: number): boolean;
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
    /** Progress counter for a live bar in the run view; absent for coarse start/done events. */
    current?: number;
    total?: number;
    degraded?: string[];
    [key: string]: unknown;
}
