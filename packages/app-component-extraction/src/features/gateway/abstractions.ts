import { createAbstraction } from "@webiny/feature/admin";
import type {
    CreateJobData,
    JobDto,
    JobListItemDto,
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
    /** The full log trail of a stage's background task, oldest first. */
    listStageLogs(taskId: string): Promise<StageLogItem[]>;
    /** The structured artifact a stage produced, for the visibility views. Null if the stage has no output. */
    getStageArtifact(runId: string, stage: string): Promise<unknown>;
    /** Rewrite Discover's URL list before Capture; returns the run with Capture+downstream marked stale. */
    updateDiscoverUrls(
        runId: string,
        urls: Array<{ url: string; group?: string }>
    ): Promise<RunDto>;
    /** Drop captured/failed pages from a run; returns the run with Segment+downstream marked stale. */
    excludeCapturedPages(runId: string, urls: string[]): Promise<RunDto>;
    /** Trigger the render task that screenshots the run's generated components (W7.7). */
    renderComponents(runId: string): Promise<StageTriggerResult>;
    /** The rendered-component screenshots for a run, or null if none produced yet. */
    getRenders(runId: string): Promise<unknown>;
}

export const ComponentExtractionGateway = createAbstraction<IComponentExtractionGateway>(
    "ComponentExtraction/Gateway"
);

export namespace ComponentExtractionGateway {
    export type Interface = IComponentExtractionGateway;
}
