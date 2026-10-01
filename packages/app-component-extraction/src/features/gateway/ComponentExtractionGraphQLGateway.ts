import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { ComponentExtractionGateway, type StageTriggerResult } from "./abstractions.js";
import type {
    CreateJobData,
    JobDto,
    JobListItemDto,
    ComposedCaptureDto,
    OverrideDto,
    PageMapDto,
    ReachabilityDto,
    ReattachmentDto,
    RunDto,
    StageLogItem,
    StageTaskOutput,
    ThemeOptionDto
} from "~/shared/types.js";
import {
    CHECK_REACHABILITY,
    CLEAR_OVERRIDE,
    COMPOSE_PAGES,
    CREATE_JOB,
    CREATE_RUN,
    EXCLUDE_CAPTURED_PAGES,
    GET_DECISIONS,
    GET_COMPOSED_CAPTURE,
    GET_JOB,
    GET_PAGE_MAP,
    GET_REATTACHMENTS,
    GET_RENDERS,
    GET_RUN,
    GET_STAGE_ARTIFACT,
    GET_GENERATED_COMPONENT,
    GET_STAGE_TASK,
    GET_WEBSITE_DOMAIN,
    LIST_JOBS,
    LIST_LIBRARY_NAMES,
    LIST_MODEL_CALLS,
    LIST_OVERRIDES,
    LIST_RUNS,
    LIST_THEMES,
    PROJECT_PLAN_COST,
    REGENERATE_COMPONENT,
    REGENERATE_PLAN,
    RENDER_COMPONENTS,
    RUN_STAGE,
    SET_COMPONENT_DECISION,
    SET_OVERRIDE
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

    async checkReachability(url: string): Promise<ReachabilityDto> {
        const response = await this.client.execute<{
            componentExtractionCheckReachability: GqlEnvelope<ReachabilityDto>;
        }>({ query: CHECK_REACHABILITY, variables: { url } });

        return unwrap(response.componentExtractionCheckReachability) as ReachabilityDto;
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

    async getStageArtifact(runId: string, stage: string, machine?: boolean): Promise<unknown> {
        const response = await this.client.execute<{
            componentExtractionGetStageArtifact: GqlEnvelope<unknown>;
        }>({ query: GET_STAGE_ARTIFACT, variables: { runId, stage, machine } });

        return unwrap(response.componentExtractionGetStageArtifact);
    }

    async getGeneratedComponent(runId: string, signature: string): Promise<unknown> {
        const response = await this.client.execute<{
            componentExtractionGetGeneratedComponent: GqlEnvelope<unknown>;
        }>({ query: GET_GENERATED_COMPONENT, variables: { runId, signature } });

        return unwrap(response.componentExtractionGetGeneratedComponent);
    }

    async excludeCapturedPages(runId: string, urls: string[]): Promise<RunDto> {
        const response = await this.client.execute<{
            componentExtractionExcludeCapturedPages: GqlEnvelope<RunDto>;
        }>({ query: EXCLUDE_CAPTURED_PAGES, variables: { runId, urls } });

        return unwrap(response.componentExtractionExcludeCapturedPages);
    }

    async renderComponents(runId: string, signature?: string): Promise<StageTriggerResult> {
        const response = await this.client.execute<{
            componentExtractionRenderComponents: GqlEnvelope<StageTriggerResult>;
        }>({ query: RENDER_COMPONENTS, variables: { runId, signature } });

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

    async getPageMap(runId: string): Promise<PageMapDto | null> {
        const response = await this.client.execute<{
            pageCompositionPocPageMap: GqlEnvelope<PageMapDto | null>;
        }>({ query: GET_PAGE_MAP, variables: { runId } });

        return unwrap(response.pageCompositionPocPageMap) ?? null;
    }

    async getComposedCapture(runId: string): Promise<ComposedCaptureDto | null> {
        const response = await this.client.execute<{
            pageCompositionPocComposedCapture: GqlEnvelope<ComposedCaptureDto | null>;
        }>({ query: GET_COMPOSED_CAPTURE, variables: { runId } });

        return unwrap(response.pageCompositionPocComposedCapture) ?? null;
    }

    async composePages(runId: string): Promise<{ taskId: string; runId: string }> {
        const response = await this.client.execute<{
            pageCompositionPocComposePages: GqlEnvelope<{ taskId: string; runId: string }>;
        }>({ query: COMPOSE_PAGES, variables: { runId } });

        return unwrap(response.pageCompositionPocComposePages);
    }

    async getLivePageIds(paths: string[]): Promise<Record<string, string | null>> {
        if (paths.length === 0) {
            return {};
        }

        /*
         * One aliased document rather than a request per path.
         *
         * A composed page is only what a visitor sees if its path resolves to it, and nothing else
         * can answer that — several published pages can claim one path, so the map naming a page is
         * not the same as that page being live. Asked in one round trip because the panel needs it
         * for every row before it can render any of them honestly.
         */
        const fields = paths
            .map(
                (path, index) =>
                    `p${index}: getPageByPath(path: ${JSON.stringify(path)}) { data { id } error { message } }`
            )
            .join("\n");

        const response = await this.client.execute<{
            websiteBuilder: Record<string, GqlEnvelope<{ id: string } | null>>;
        }>({ query: `query GetLivePages { websiteBuilder { ${fields} } }` });

        const live: Record<string, string | null> = {};
        paths.forEach((path, index) => {
            const entry = response.websiteBuilder?.[`p${index}`];
            // A path that resolves to nothing is a real answer — the page is published but something
            // else is wrong — so it is recorded as null rather than skipped.
            live[path] = entry?.error ? null : (entry?.data?.id ?? null);
        });
        return live;
    }

    async getWebsiteDomain(): Promise<string | null> {
        const response = await this.client.execute<{
            websiteBuilder: { getSettings: GqlEnvelope<{ previewDomain: string } | null> };
        }>({ query: GET_WEBSITE_DOMAIN });

        // Trailing slashes removed here, where the value is read, so joining it with a page path
        // (which always starts with "/") can never produce a double slash.
        const domain = unwrap(response.websiteBuilder.getSettings)?.previewDomain ?? "";
        return domain.replace(/\/+$/, "") || null;
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

    async listLibraryNames(): Promise<string[]> {
        const response = await this.client.execute<{
            componentExtractionListLibraryNames: GqlEnvelope<string[]>;
        }>({ query: LIST_LIBRARY_NAMES });

        return unwrap(response.componentExtractionListLibraryNames) ?? [];
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

    async regeneratePlanComponent(
        runId: string,
        signature: string,
        instruction?: string
    ): Promise<StageTriggerResult> {
        const response = await this.client.execute<{
            componentExtractionRegeneratePlan: GqlEnvelope<StageTriggerResult>;
        }>({ query: REGENERATE_PLAN, variables: { runId, signature, instruction } });

        return unwrap(response.componentExtractionRegeneratePlan);
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
