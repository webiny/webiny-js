import { createAbstraction } from "@webiny/feature/admin";
import type {
    CreateJobData,
    JobDto,
    JobListItemDto,
    OverrideDto,
    ComposedCaptureDto,
    PageMapDto,
    SiteDto,
    ReachabilityDto,
    ReattachmentDto,
    RunDto,
    StageTaskTrail,
    ThemeOptionDto,
    ReviewInputDto,
    ReviewsDto,
    GenerationLogDto,
    GenerationPromptDto,
    ThemeFitDto
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
    /** Extract the job's theme again: after a failure, or to replace a theme it has (re-pins). */
    retryJobTheme(jobId: string): Promise<JobDto>;
    /** Pin an existing published theme on the job instead of extracting one. */
    useExistingTheme(jobId: string, themeEntryId: string, themeVersion: number): Promise<JobDto>;
    /** How well the job's theme fits what was measured, after Plan; null before Plan. */
    getThemeFit(runId: string): Promise<ThemeFitDto | null>;
    /** Pre-flight check of a site URL for the Create-job screen (W9.3). */
    checkReachability(url: string): Promise<ReachabilityDto>;
    /** The full log trail of a stage's background task, oldest first. */
    /**
     * A stage task's activity trail and latest progress. The progress is what the poll shows: the
     * websocket push reaches only the identity that started the stage, so anyone else watching the run
     * (or an API-started stage) would otherwise see a waiting screen that never moves.
     */
    listStageLogs(taskId: string): Promise<StageTaskTrail>;
    /** The structured artifact a stage produced, for the visibility views. Null if the stage has no output. */
    getStageArtifact(runId: string, stage: string, machine?: boolean): Promise<unknown>;
    /**
     * One generated component in full. The Generate artifact references its components rather than
     * carrying them, so the list is served without their source and a view that opens one asks for it.
     */
    getGeneratedComponent(runId: string, signature: string): Promise<unknown>;
    getComponentPrompt(runId: string, signature: string): Promise<unknown>;
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
    /**
     * Generate components again through Generate itself — its original prompt, checks and retries —
     * each replacing its component. Returns the task per signature.
     */
    generateComponents(
        runId: string,
        signatures: string[]
    ): Promise<{ tasks: { signature: string; taskId: string }[] }>;
    /** A background task's status (`pending`, `running`, `success`, `failed`, `aborted`…), or null. */
    getTaskStatus(taskId: string): Promise<string | null>;
    /** A component's generation log: every Generate attempt, oldest first, without prompts. */
    getGenerationLog(runId: string, signature: string): Promise<GenerationLogDto>;
    /** One attempt's whole prompt; null when the log has no such attempt. */
    getGenerationPrompt(
        runId: string,
        signature: string,
        entryId: string
    ): Promise<GenerationPromptDto | null>;
    /** Human review verdicts for a run's generated components, with the verdict and reason lists. */
    getReviews(runId: string): Promise<ReviewsDto>;
    /** Record a review verdict on a component's current output; returns the updated reviews. */
    setComponentReview(
        runId: string,
        signature: string,
        review: ReviewInputDto
    ): Promise<ReviewsDto>;
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
    /** Cancel a waiting or failed run; its results stay readable. */
    cancelRun(runId: string): Promise<void>;
    /** Build the job's site in its own tenant: tenant, theme, promoted components, images, pages. */
    buildSite(runId: string): Promise<{ taskId: string; runId: string }>;
    /** A job's site in its own tenant and its last build, or null when it has none. */
    getSite(jobId: string): Promise<SiteDto | null>;
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
