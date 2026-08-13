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
}

export const ComponentExtractionGateway = createAbstraction<IComponentExtractionGateway>(
    "ComponentExtraction/Gateway"
);

export namespace ComponentExtractionGateway {
    export type Interface = IComponentExtractionGateway;
}
