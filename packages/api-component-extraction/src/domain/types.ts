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

// ----- Override (W8) -----------------------------------------------------------------------------

/**
 * A correction payload, discriminated by `kind`. Keyed on structural signatures / normalised URLs (the
 * identity that survives a re-run), never on array positions or member sets. The cluster kinds record
 * the signatures the correction was made against so re-clustering can reattach them.
 */
export type Correction =
    // Page-level (Discover, Capture, Segment) — the override is keyed by the page's normalised URL.
    | { kind: "page.exclude" }
    | { kind: "discover.url"; action: "include" | "exclude" | "add"; group?: string }
    // Cluster (keyed by representative signature except merge/split, which carry their own signatures).
    | { kind: "cluster.exclude" }
    | {
          kind: "cluster.merge";
          /** Representative signatures of the clusters merged; ≥2 present on a run re-merge. */
          representativeSignatures: string[];
          /** The representative the user pinned, if any; otherwise the largest member set wins. */
          representativeSignature?: string;
      }
    | { kind: "cluster.split"; memberSignatures: string[] }
    | { kind: "cluster.move"; memberSignature: string; targetRepresentativeSignature: string }
    // Parameter override — changes what Cluster runs with, so it requires a re-run (not applied in place).
    | { kind: "cluster.threshold"; threshold: number }
    // Classify / Plan / Generate / Promote — keyed by cluster signature.
    | { kind: "classify.set"; name?: string; type?: string }
    | {
          kind: "plan.prop";
          op: "edit" | "add" | "remove";
          propName: string;
          newName?: string;
          type?: string;
      }
    | { kind: "generate.decision"; decision: "accepted" | "rejected" }
    | { kind: "generate.regenerate"; instruction: string }
    | { kind: "promote.select"; selected: boolean }
    | { kind: "promote.collision"; resolution: "replace" | "keepBoth"; renameTo?: string };

export type CorrectionKind = Correction["kind"];

/**
 * How an override takes effect. An `artifact` override edits a stage's OUTPUT in place (rename, merge,
 * prop edit) and marks downstream stale; a `parameter` override changes a stage's INPUT (the cluster
 * similarity threshold) and only takes effect on a re-run.
 */
export type OverrideMode = "artifact" | "parameter";

/**
 * A correction to a stage's output. Belongs to the Job (not the Run), so it survives and reapplies across
 * runs. `structuralSignature` is the primary reattach key — a representative signature for a cluster
 * correction, a normalised URL for a page one, a cluster signature for classify/plan/generate/promote.
 */
export interface OverrideValues {
    jobId: string;
    stage: Stage;
    /** The structural signature (or normalised URL) the correction attaches to. */
    structuralSignature: string;
    correction: Correction;
    /** The run the correction originated in. */
    originRunId: string;
}

export interface Override extends OverrideValues {
    id: string;
    entryId: string;
    createdOn: string;
    tenant: string;
}

/** The result of reattaching one override on a run. Never dropped silently — surfaced in the panel (W8.7). */
export type ReattachStatus = "applied" | "not-applicable" | "conflicting";

export interface Reattachment {
    overrideId: string;
    stage: Stage;
    signature: string;
    kind: CorrectionKind;
    status: ReattachStatus;
    /** Why an override did not cleanly apply — null when applied. */
    reason: string | null;
}

// ----- Correction log (W8.2) ---------------------------------------------------------------------

/**
 * One append-only correction-log entry — the labelled ground truth for the eval harness. Written the
 * moment a correction is made (not on reattachment), carrying BOTH the machine value for the affected
 * item and the human value, so a run's decisions can be reconstructed later. Nothing in the UI reads it.
 */
export interface CorrectionLogValues {
    runId: string;
    jobId: string;
    stage: Stage;
    stageVersion: number;
    signature: string;
    kind: CorrectionKind;
    machineValue: unknown;
    humanValue: unknown;
}

export interface CorrectionLogEntry extends CorrectionLogValues {
    id: string;
    entryId: string;
    createdOn: string;
    tenant: string;
}
