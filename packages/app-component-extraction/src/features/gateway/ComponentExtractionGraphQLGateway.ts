import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { ComponentExtractionGateway, type StageTriggerResult } from "./abstractions.js";
import type {
    CreateJobData,
    JobDto,
    JobListItemDto,
    OverrideDto,
    ReattachmentDto,
    RunDto,
    StageLogItem,
    StageTaskOutput,
    ThemeOptionDto
} from "~/shared/types.js";
import {
    CLEAR_OVERRIDE,
    CREATE_JOB,
    CREATE_RUN,
    EXCLUDE_CAPTURED_PAGES,
    GET_DECISIONS,
    GET_JOB,
    GET_REATTACHMENTS,
    GET_RENDERS,
    GET_RUN,
    GET_STAGE_ARTIFACT,
    GET_STAGE_TASK,
    LIST_JOBS,
    LIST_MODEL_CALLS,
    LIST_OVERRIDES,
    LIST_RUNS,
    LIST_THEMES,
    PROJECT_PLAN_COST,
    REGENERATE_COMPONENT,
    RENDER_COMPONENTS,
    RUN_STAGE,
    SET_COMPONENT_DECISION,
    SET_OVERRIDE,
    UPDATE_DISCOVER_URLS
} from "./graphql.js";

interface GqlEnvelope<T> {
    data: T | null;
    error: { code: string; message: string } | null;
}

const unwrap = <T>(envelope: GqlEnvelope<T>): T => {
    if (envelope.error) {
        throw new Error(envelope.error.message);
    }
    return envelope.data as T;
};

class ComponentExtractionGraphQLGatewayImpl implements ComponentExtractionGateway.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async listJobs(): Promise<JobListItemDto[]> {
        const response = await this.client.execute<{
            componentExtractionListJobs: GqlEnvelope<JobListItemDto[]>;
        }>({ query: LIST_JOBS });

        return unwrap(response.componentExtractionListJobs) ?? [];
    }

    async getJob(jobId: string): Promise<JobDto> {
        const response = await this.client.execute<{
            componentExtractionGetJob: GqlEnvelope<JobDto>;
        }>({ query: GET_JOB, variables: { jobId } });

        return unwrap(response.componentExtractionGetJob);
    }

    async createJob(data: CreateJobData): Promise<JobDto> {
        const response = await this.client.execute<{
            componentExtractionCreateJob: GqlEnvelope<JobDto>;
        }>({ query: CREATE_JOB, variables: { data } });

        return unwrap(response.componentExtractionCreateJob);
    }

    async listRuns(jobId: string): Promise<RunDto[]> {
        const response = await this.client.execute<{
            componentExtractionListRuns: GqlEnvelope<RunDto[]>;
        }>({ query: LIST_RUNS, variables: { jobId } });

        return unwrap(response.componentExtractionListRuns) ?? [];
    }

    async getRun(runId: string): Promise<RunDto> {
        const response = await this.client.execute<{
            componentExtractionGetRun: GqlEnvelope<RunDto>;
        }>({ query: GET_RUN, variables: { runId } });

        return unwrap(response.componentExtractionGetRun);
    }

    async createRun(jobId: string, note?: string): Promise<RunDto> {
        const response = await this.client.execute<{
            componentExtractionCreateRun: GqlEnvelope<RunDto>;
        }>({ query: CREATE_RUN, variables: { jobId, note } });

        return unwrap(response.componentExtractionCreateRun);
    }

    async runStage(runId: string, stage: string): Promise<StageTriggerResult> {
        const response = await this.client.execute<{
            componentExtractionRunStage: GqlEnvelope<StageTriggerResult>;
        }>({ query: RUN_STAGE, variables: { runId, stage } });

        return unwrap(response.componentExtractionRunStage);
    }

    async listThemes(): Promise<ThemeOptionDto[]> {
        const response = await this.client.execute<{
            theme: {
                listThemes: GqlEnvelope<
                    Array<{ id: string; version: number; properties: { name?: string } | null }>
                >;
            };
        }>({ query: LIST_THEMES });

        const themes = unwrap(response.theme.listThemes) ?? [];
        return themes.map(theme => ({
            id: theme.id,
            version: theme.version,
            name: theme.properties?.name || "Untitled theme"
        }));
    }

    async listStageLogs(taskId: string): Promise<StageLogItem[]> {
        const response = await this.client.execute<{
            backgroundTasks: {
                getTask: GqlEnvelope<{ id: string; output: StageTaskOutput | null }>;
            };
        }>({ query: GET_STAGE_TASK, variables: { id: taskId } });

        const task = unwrap(response.backgroundTasks.getTask);
        const activity = task?.output?.activity ?? [];
        return activity.map(entry => ({
            message: entry.message,
            type: "info",
            createdOn: entry.at
        }));
    }

    async getStageArtifact(runId: string, stage: string): Promise<unknown> {
        const response = await this.client.execute<{
            componentExtractionGetStageArtifact: GqlEnvelope<unknown>;
        }>({ query: GET_STAGE_ARTIFACT, variables: { runId, stage } });

        return unwrap(response.componentExtractionGetStageArtifact);
    }

    async updateDiscoverUrls(
        runId: string,
        urls: Array<{ url: string; group?: string }>
    ): Promise<RunDto> {
        const response = await this.client.execute<{
            componentExtractionUpdateDiscoverUrls: GqlEnvelope<RunDto>;
        }>({ query: UPDATE_DISCOVER_URLS, variables: { runId, urls } });

        return unwrap(response.componentExtractionUpdateDiscoverUrls);
    }

    async excludeCapturedPages(runId: string, urls: string[]): Promise<RunDto> {
        const response = await this.client.execute<{
            componentExtractionExcludeCapturedPages: GqlEnvelope<RunDto>;
        }>({ query: EXCLUDE_CAPTURED_PAGES, variables: { runId, urls } });

        return unwrap(response.componentExtractionExcludeCapturedPages);
    }

    async renderComponents(runId: string): Promise<StageTriggerResult> {
        const response = await this.client.execute<{
            componentExtractionRenderComponents: GqlEnvelope<StageTriggerResult>;
        }>({ query: RENDER_COMPONENTS, variables: { runId } });

        return unwrap(response.componentExtractionRenderComponents);
    }

    async getRenders(runId: string): Promise<unknown> {
        const response = await this.client.execute<{
            componentExtractionGetRenders: GqlEnvelope<unknown>;
        }>({ query: GET_RENDERS, variables: { runId } });

        return unwrap(response.componentExtractionGetRenders);
    }

    async getDecisions(runId: string): Promise<unknown> {
        const response = await this.client.execute<{
            componentExtractionGetDecisions: GqlEnvelope<unknown>;
        }>({ query: GET_DECISIONS, variables: { runId } });

        return unwrap(response.componentExtractionGetDecisions);
    }

    async listOverrides(jobId: string): Promise<OverrideDto[]> {
        const response = await this.client.execute<{
            componentExtractionListOverrides: GqlEnvelope<OverrideDto[]>;
        }>({ query: LIST_OVERRIDES, variables: { jobId } });

        return unwrap(response.componentExtractionListOverrides) ?? [];
    }

    async getReattachments(runId: string): Promise<ReattachmentDto[]> {
        const response = await this.client.execute<{
            componentExtractionGetReattachments: GqlEnvelope<ReattachmentDto[]>;
        }>({ query: GET_REATTACHMENTS, variables: { runId } });

        return unwrap(response.componentExtractionGetReattachments) ?? [];
    }

    async setOverride(
        runId: string,
        stage: string,
        signature: string,
        correction: unknown
    ): Promise<OverrideDto[]> {
        const response = await this.client.execute<{
            componentExtractionSetOverride: GqlEnvelope<OverrideDto[]>;
        }>({ query: SET_OVERRIDE, variables: { runId, stage, signature, correction } });

        return unwrap(response.componentExtractionSetOverride) ?? [];
    }

    async clearOverride(runId: string, overrideId: string): Promise<OverrideDto[]> {
        const response = await this.client.execute<{
            componentExtractionClearOverride: GqlEnvelope<OverrideDto[]>;
        }>({ query: CLEAR_OVERRIDE, variables: { runId, overrideId } });

        return unwrap(response.componentExtractionClearOverride) ?? [];
    }

    async setComponentDecision(
        runId: string,
        signature: string,
        decision: string
    ): Promise<unknown> {
        const response = await this.client.execute<{
            componentExtractionSetComponentDecision: GqlEnvelope<unknown>;
        }>({ query: SET_COMPONENT_DECISION, variables: { runId, signature, decision } });

        return unwrap(response.componentExtractionSetComponentDecision);
    }

    async regenerateComponent(
        runId: string,
        signature: string,
        instruction: string
    ): Promise<StageTriggerResult> {
        const response = await this.client.execute<{
            componentExtractionRegenerateComponent: GqlEnvelope<StageTriggerResult>;
        }>({ query: REGENERATE_COMPONENT, variables: { runId, signature, instruction } });

        return unwrap(response.componentExtractionRegenerateComponent);
    }

    async listModelCalls(runId: string): Promise<unknown> {
        const response = await this.client.execute<{
            componentExtractionListModelCalls: GqlEnvelope<unknown>;
        }>({ query: LIST_MODEL_CALLS, variables: { runId } });

        return unwrap(response.componentExtractionListModelCalls);
    }

    async projectPlanCost(runId: string): Promise<unknown> {
        const response = await this.client.execute<{
            componentExtractionProjectPlanCost: GqlEnvelope<unknown>;
        }>({ query: PROJECT_PLAN_COST, variables: { runId } });

        return unwrap(response.componentExtractionProjectPlanCost);
    }
}

export const ComponentExtractionGraphQLGateway = ComponentExtractionGateway.createImplementation({
    implementation: ComponentExtractionGraphQLGatewayImpl,
    dependencies: [MainGraphQLClient]
});
