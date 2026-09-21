import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type {
    CorrectionLogEntry,
    CorrectionLogValues,
    Job,
    JobValues,
    ModelCall,
    ModelCallValues,
    Override,
    OverrideValues,
    Run,
    RunValues
} from "./types.js";
import type { ExtractionError } from "./errors.js";

/**
 * Providers for the five CMS models this feature stores its entities in. Repositories inject a
 * provider and `await get()` inside the method that needs the model, rather than injecting an
 * already-resolved `CmsModel`: resolution is synchronous while fetching a model is not, so the
 * resolved value could only ever be supplied by a per-request hook that had to run before any
 * consumer. See `ai-context/code-style/prefer-provider-over-resolved-value.md`.
 */
export interface ICmsModelProvider {
    get(): Promise<CmsModel>;
}

export const JobModelProvider = createAbstraction<ICmsModelProvider>(
    "ComponentExtraction/JobModelProvider"
);
export namespace JobModelProvider {
    export type Interface = ICmsModelProvider;
}

export const RunModelProvider = createAbstraction<ICmsModelProvider>(
    "ComponentExtraction/RunModelProvider"
);
export namespace RunModelProvider {
    export type Interface = ICmsModelProvider;
}

export const OverrideModelProvider = createAbstraction<ICmsModelProvider>(
    "ComponentExtraction/OverrideModelProvider"
);
export namespace OverrideModelProvider {
    export type Interface = ICmsModelProvider;
}

export const ModelCallModelProvider = createAbstraction<ICmsModelProvider>(
    "ComponentExtraction/ModelCallModelProvider"
);
export namespace ModelCallModelProvider {
    export type Interface = ICmsModelProvider;
}

export const CorrectionModelProvider = createAbstraction<ICmsModelProvider>(
    "ComponentExtraction/CorrectionModelProvider"
);
export namespace CorrectionModelProvider {
    export type Interface = ICmsModelProvider;
}

/** Paged-list envelope. `cursor` is opaque and passed straight back as `after`. */
export interface ListMeta {
    cursor: string | null;
    totalCount: number;
    hasMoreItems: boolean;
}

export interface ListParams {
    where?: Record<string, unknown>;
    sort?: Array<`${string}_ASC` | `${string}_DESC`>;
    limit?: number;
    after?: string | null;
    search?: string;
}

// ----- Job repository ----------------------------------------------------------------------------

export interface IJobRepository {
    create(values: JobValues): Promise<Result<Job, ExtractionError>>;
    get(id: string): Promise<Result<Job, ExtractionError>>;
    list(params?: ListParams): Promise<Result<{ jobs: Job[]; meta: ListMeta }, ExtractionError>>;
    update(id: string, values: Partial<JobValues>): Promise<Result<Job, ExtractionError>>;
}

export const JobRepository = createAbstraction<IJobRepository>("ComponentExtraction/JobRepository");
export namespace JobRepository {
    export type Interface = IJobRepository;
}

// ----- Run repository ----------------------------------------------------------------------------

export interface IRunRepository {
    create(values: RunValues): Promise<Result<Run, ExtractionError>>;
    get(id: string): Promise<Result<Run, ExtractionError>>;
    listByJob(
        jobId: string,
        params?: ListParams
    ): Promise<Result<{ runs: Run[]; meta: ListMeta }, ExtractionError>>;
    update(id: string, values: Partial<RunValues>): Promise<Result<Run, ExtractionError>>;
}

export const RunRepository = createAbstraction<IRunRepository>("ComponentExtraction/RunRepository");
export namespace RunRepository {
    export type Interface = IRunRepository;
}

// ----- Override repository (W8.1) -----------------------------------------------------------------

export interface IOverrideRepository {
    create(values: OverrideValues): Promise<Result<Override, ExtractionError>>;
    listByJob(jobId: string): Promise<Result<Override[], ExtractionError>>;
    /**
     * Set an override, replacing any existing one with the same (job, stage, signature, kind) rather than
     * stacking a second — re-correcting an item replaces its correction (W8.1).
     */
    upsert(values: OverrideValues): Promise<Result<Override, ExtractionError>>;
    /** Clear an override, reverting that item to machine output. */
    delete(id: string): Promise<Result<void, ExtractionError>>;
}

export const OverrideRepository = createAbstraction<IOverrideRepository>(
    "ComponentExtraction/OverrideRepository"
);
export namespace OverrideRepository {
    export type Interface = IOverrideRepository;
}

// ----- Correction log repository (W8.2) -----------------------------------------------------------

export interface ICorrectionRepository {
    create(values: CorrectionLogValues): Promise<Result<CorrectionLogEntry, ExtractionError>>;
    listByRun(runId: string): Promise<Result<CorrectionLogEntry[], ExtractionError>>;
}

export const CorrectionRepository = createAbstraction<ICorrectionRepository>(
    "ComponentExtraction/CorrectionRepository"
);
export namespace CorrectionRepository {
    export type Interface = ICorrectionRepository;
}

// ----- Model call repository ----------------------------------------------------------------------

export interface IModelCallRepository {
    create(values: ModelCallValues): Promise<Result<ModelCall, ExtractionError>>;
    /** A run's calls, optionally narrowed to one stage (and its version) for the per-stage aggregate. */
    listByRun(
        runId: string,
        params?: { stage?: string; stageVersion?: number; limit?: number }
    ): Promise<Result<ModelCall[], ExtractionError>>;
}

export const ModelCallRepository = createAbstraction<IModelCallRepository>(
    "ComponentExtraction/ModelCallRepository"
);
export namespace ModelCallRepository {
    export type Interface = IModelCallRepository;
}

// ----- Run lock ----------------------------------------------------------------------------------

/**
 * One in-flight run per job, on the tenant-scoped key-value store. Re-acquiring your own lock succeeds,
 * so a stage task that resumes after a `continue` iteration is not locked out by itself — the same
 * check-then-set trade the theme extraction lock documents.
 */
export interface IRunLock {
    /** False when another run already holds this job's lock. */
    acquire(jobId: string, runId: string): Promise<Result<boolean, ExtractionError>>;
    release(jobId: string, runId: string): Promise<Result<void, ExtractionError>>;
    current(jobId: string): Promise<Result<string | null, ExtractionError>>;
}

export const RunLock = createAbstraction<IRunLock>("ComponentExtraction/RunLock");
export namespace RunLock {
    export type Interface = IRunLock;
}
