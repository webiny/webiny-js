import { createAbstraction } from "@webiny/feature/admin";
import type {
    CreateJobData,
    JobDto,
    JobListItemDto,
    OverrideDto,
    ComposedCaptureDto,
    PageMapDto,
    ReachabilityDto,
    ReattachmentDto,
    RunDto,
    StageLogItem,
    ThemeOptionDto
} from "~/shared/types.js";

export interface StageTriggerResult {
    taskId: string;
    runId: string;
    stage: string;
}

export interface IComponentExtractionGateway {
    listJobs(): Promise<JobListItemDto[]>;
    getJob(jobId: string): Promise<JobDto>;
    createJob(data: CreateJobData): Promise<JobDto>;
    listRuns(jobId: string): Promise<RunDto[]>;
    getRun(runId: string): Promise<RunDto>;
    createRun(jobId: string, note?: string): Promise<RunDto>;
    runStage(runId: string, stage: string): Promise<StageTriggerResult>;
    listThemes(): Promise<ThemeOptionDto[]>;
    /** Pre-flight check of a site URL for the Create-job screen (W9.3). */
    checkReachability(url: string): Promise<ReachabilityDto>;
    /** The full log trail of a stage's background task, oldest first. */
    listStageLogs(taskId: string): Promise<StageLogItem[]>;
    /** The structured artifact a stage produced, for the visibility views. Null if the stage has no output. */
    getStageArtifact(runId: string, stage: string, machine?: boolean): Promise<unknown>;
    /**
     * One generated component in full. The Generate artifact references its components rather than
     * carrying them, so the list is served without their source and a view that opens one asks for it.
     */
    getGeneratedComponent(runId: string, signature: string): Promise<unknown>;
    /** Drop captured/failed pages from a run; returns the run with Segment+downstream marked stale. */
    excludeCapturedPages(runId: string, urls: string[]): Promise<RunDto>;
    /** Trigger the render task that screenshots the run's generated components (W7.7). */
    /**
     * Trigger the rendered-component screenshot pass. With a signature, re-renders just that one
     * component and leaves the other results untouched.
     */
    renderComponents(runId: string, signature?: string): Promise<StageTriggerResult>;
    /** Read selected captured pages again, replacing them in place. Returns the background task. */
    recapturePages(runId: string, urls: string[]): Promise<StageTriggerResult>;
    /** The rendered-component screenshots for a run, or null if none produced yet. */
    getRenders(runId: string): Promise<unknown>;
    /** The operator's accept/reject decisions for a run's generated components (W7.8). */
    getDecisions(runId: string): Promise<unknown>;
    /** Set (or clear, with "none") a component's decision; returns the updated decision map. */
    setComponentDecision(runId: string, signature: string, decision: string): Promise<unknown>;
    /** Regenerate one component from an instruction via the refine path (W7.8). */
    regenerateComponent(
        runId: string,
        signature: string,
        instruction: string
    ): Promise<StageTriggerResult>;
    /** Regenerate one component's Plan contract — a fresh props/token-binding proposal, optionally steered (W8). */
    regeneratePlanComponent(
        runId: string,
        signature: string,
        instruction?: string
    ): Promise<StageTriggerResult>;
    /** A run's individual model calls, for the token panel (W7.9). */
    listModelCalls(runId: string): Promise<unknown>;
    /** The projected generation cost for a run's plan (W7.9). */
    projectPlanCost(runId: string): Promise<unknown>;
    /** A job's active overrides (W8.1). */
    listOverrides(jobId: string): Promise<OverrideDto[]>;
    /** A run's override reattachment outcomes (W8.1). */
    getReattachments(runId: string): Promise<ReattachmentDto[]>;
    /** The run's composed pages, or null when composition has not been run for it. */
    getPageMap(runId: string): Promise<PageMapDto | null>;
    /** Screenshots of the composed pages, or null when nobody has run the local harness for it. */
    getComposedCapture(runId: string): Promise<ComposedCaptureDto | null>;
    /** Compose this run's pages. Background task; the page map changing is how it reports done. */
    composePages(runId: string): Promise<{ taskId: string; runId: string }>;
    /** Where the migrated site is served from — Website Builder's preview domain. Null if unset. */
    getWebsiteDomain(): Promise<string | null>;
    /**
     * The page each path actually resolves to, keyed by path.
     *
     * A composed page is only what a visitor sees if its path resolves to it, and the page map alone
     * cannot say — several published pages can claim one path.
     */
    getLivePageIds(paths: string[]): Promise<Record<string, string | null>>;
    /** Set (upsert) an override from a run, re-applying in place and marking downstream stale (W8.1). */
    setOverride(
        runId: string,
        stage: string,
        signature: string,
        correction: unknown
    ): Promise<OverrideDto[]>;
    /** Clear an override, reverting that item to machine output (W8.1). */
    clearOverride(runId: string, overrideId: string): Promise<OverrideDto[]>;
    /** Names of the components already in the Library, for Promote collision detection (W8.6). */
    listLibraryNames(): Promise<string[]>;
}

export const ComponentExtractionGateway = createAbstraction<IComponentExtractionGateway>(
    "ComponentExtraction/Gateway"
);

export namespace ComponentExtractionGateway {
    export type Interface = IComponentExtractionGateway;
}
