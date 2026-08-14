import type { Stage } from "~/constants.js";

/**
 * The domain types for jobs, runs and overrides — see the phase 1 brief, W2.
 *
 * Entities are private CMS entries (revisions, tenant scoping, locking for free). The `*Values` shapes
 * are exactly what lands on the CMS entry; the `Job`/`Run`/`Override` types add the entry envelope.
 */

export interface Identity {
    id: string;
    displayName: string | null;
    type: string;
}

/** A stage's status within a run's ledger. `stale` = a re-run upstream invalidated this stage's output. */
export type StageStatus = "pending" | "running" | "done" | "stale" | "failed";

/**
 * One of the nine ledger entries carried on a run.
 *
 * `stageVersion` is monotonic per stage: re-running a stage bumps it, which is how a stale downstream
 * artifact is detected (it was produced against an older upstream version). `artifacts` holds
 * references — S3 keys, KV keys — never artifact bodies.
 */
/** The per-stage model-usage aggregate, written once by the runner when a model-backed stage closes. */
export interface StageModelUsage {
    inputTokens: number;
    outputTokens: number;
    /** Number of model calls, counting retries and failures. */
    calls: number;
    latencyMs: number;
}

export interface StageLedgerEntry {
    stage: Stage;
    status: StageStatus;
    stageVersion: number;
    artifacts: Record<string, string>;
    startedOn: string | null;
    finishedOn: string | null;
    error: string | null;
    /**
     * The background task id of the latest run of this stage. Lets the admin deep-link straight to that
     * task's log trail in the Background Tasks viewer, so the full per-item log is one click away.
     */
    taskId: string | null;
    /**
     * The stage's model-usage totals, or null for a deterministic stage / before it closes. Written once
     * at stage close (single writer); while the stage runs the UI sums the individual call records.
     */
    modelUsage: StageModelUsage | null;
}

// ----- Model call --------------------------------------------------------------------------------

/**
 * One model call made by a model-backed stage (Classify, Plan, Generate). Stored one entry per call so
 * concurrent writers never clobber a shared array — recorded by the `Ai` wrapper, aggregated per stage
 * by the runner. Failed and retried calls are recorded too; a component that took three attempts cost
 * three calls, which is what we want visible.
 */
export interface ModelCallValues {
    runId: string;
    stage: Stage;
    stageVersion: number;
    /** The call name, e.g. `classify-section`, `plan-component`, `generate-component`. */
    name: string;
    modelId: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    /** False for a call that errored (it still cost tokens up to the failure and is counted). */
    ok: boolean;
}

export interface ModelCall extends ModelCallValues {
    id: string;
    entryId: string;
    createdOn: string;
    tenant: string;
}

/** Which stages a run pauses at. The stop-after set; phase 1 default is every stage (manual gate). */
export interface GateConfig {
    stopAfter: Stage[];
}

/** The pinned theme a job extracts against — resolved via `toRevisionId(entryId, version)`. */
export interface ThemePin {
    entryId: string;
    version: number;
}

// ----- Job ---------------------------------------------------------------------------------------

export interface JobValues {
    name: string;
    siteUrl: string;
    themeEntryId: string;
    themeVersion: number;
    pageCap: number;
    gateConfig: GateConfig;
    pinned: boolean;
    note: string;
}

export interface Job extends JobValues {
    id: string;
    entryId: string;
    createdOn: string;
    createdBy: Identity;
    savedOn: string;
    tenant: string;
}

// ----- Run ---------------------------------------------------------------------------------------

/** Overall run status, distinct from any single stage's status. */
export type RunStatus = "pending" | "running" | "done" | "failed";

export interface RunCounts {
    pages: number;
    sections: number;
    clusters: number;
    components: number;
}

export interface RunValues {
    jobId: string;
    runNumber: number;
    status: RunStatus;
    note: string;
    pinned: boolean;
    counts: RunCounts;
    /** The nine-entry stage ledger. Large, read by id — stored as plain json. */
    stages: StageLedgerEntry[];
}

export interface Run extends RunValues {
    id: string;
    entryId: string;
    createdOn: string;
    createdBy: Identity;
    savedOn: string;
    tenant: string;
}

// ----- Override ----------------------------------------------------------------------------------

/**
 * A user correction to a stage's output. Belongs to the Job (not the Run), so it survives and reapplies
 * across runs. Defined in phase 1, not yet populated — declared now so overrides never get built onto
 * the Run by default later.
 */
export interface OverrideValues {
    jobId: string;
    stage: Stage;
    /** The structural signature of the section/cluster the correction attaches to. */
    structuralSignature: string;
    correction: Record<string, unknown>;
    /** The run the correction originated in. */
    originRunId: string;
}

export interface Override extends OverrideValues {
    id: string;
    entryId: string;
    createdOn: string;
    tenant: string;
}
