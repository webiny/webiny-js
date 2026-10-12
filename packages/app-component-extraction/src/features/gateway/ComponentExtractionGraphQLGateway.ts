import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { ComponentExtractionGateway, type StageTriggerResult } from "./abstractions.js";
import type {
    CreateJobData,
    JobDto,
    JobListItemDto,
    ComposedCaptureDto,
    OverrideDto,
    PageMapDto,
    SiteDto,
    ReachabilityDto,
    ReattachmentDto,
    RunDto,
    StageTaskTrail,
    StageTaskOutput,
    ThemeOptionDto,
    ReviewInputDto,
    ReviewsDto,
    GenerationLogDto,
    GenerationPromptDto,
    ThemeFitDto,
    ThemeDocumentsDto
} from "~/shared/types.js";
import {
    CHECK_REACHABILITY,
    CLEAR_OVERRIDE,
    BUILD_SITE,
    CANCEL_RUN,
    COMPOSE_PAGES,
    CREATE_JOB,
    CREATE_RUN,
    EXCLUDE_CAPTURED_PAGES,
    GET_DECISIONS,
    GET_COMPOSED_CAPTURE,
    GET_JOB,
    GET_THEME_FIT,
    RETRY_JOB_THEME,
    USE_EXISTING_THEME,
    GET_PAGE_MAP,
    GET_SITE,
    GET_SITE_LIVE_PAGES,
    GET_REATTACHMENTS,
    GET_RENDERS,
    GET_RUN,
    GET_STAGE_ARTIFACT,
    GET_COMPONENT_PROMPT,
    GET_GENERATED_COMPONENT,
    GET_STAGE_TASK,
    GET_WEBSITE_DOMAIN,
    LIST_JOBS,
    LIST_LIBRARY_NAMES,
    LIST_MODEL_CALLS,
    LIST_OVERRIDES,
    LIST_RUNS,
    LIST_THEMES,
    GET_THEME,
    PROJECT_PLAN_COST,
    REGENERATE_COMPONENT,
    REGENERATE_PLAN,
    RECAPTURE_PAGES,
    RENDER_COMPONENTS,
    RUN_STAGE,
    SET_COMPONENT_DECISION,
    SET_COMPONENT_REVIEW,
    GET_REVIEWS,
    GET_GENERATION_LOG,
    GET_GENERATION_PROMPT,
    GENERATE_COMPONENTS,
    GET_TASK_STATUS,
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

    async retryJobTheme(jobId: string): Promise<JobDto> {
        const response = await this.client.execute<{
            componentExtractionRetryJobTheme: GqlEnvelope<JobDto>;
        }>({ query: RETRY_JOB_THEME, variables: { jobId } });

        return unwrap(response.componentExtractionRetryJobTheme);
    }

    async useExistingTheme(
        jobId: string,
        themeEntryId: string,
        themeVersion: number
    ): Promise<JobDto> {
        const response = await this.client.execute<{
            componentExtractionUseExistingTheme: GqlEnvelope<JobDto>;
        }>({ query: USE_EXISTING_THEME, variables: { jobId, themeEntryId, themeVersion } });

        return unwrap(response.componentExtractionUseExistingTheme);
    }

    async getThemeFit(runId: string): Promise<ThemeFitDto | null> {
        // A JSON field: the resolver's envelope comes back as the value itself.
        const response = await this.client.execute<{
            componentExtractionGetThemeFit: GqlEnvelope<ThemeFitDto | null> | null;
        }>({ query: GET_THEME_FIT, variables: { runId } });

        const envelope = response.componentExtractionGetThemeFit;
        return envelope ? unwrap(envelope) : null;
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

    async getTheme(id: string): Promise<ThemeDocumentsDto | null> {
        const response = await this.client.execute<{
            theme: { getTheme: GqlEnvelope<ThemeDocumentsDto | null> };
        }>({ query: GET_THEME, variables: { id } });

        const theme = unwrap(response.theme.getTheme);
        if (!theme) {
            return null;
        }
        // JSON scalars can arrive as strings depending on the client's parsing.
        const parse = (value: unknown) => (typeof value === "string" ? JSON.parse(value) : value);
        return { id: theme.id, tokens: parse(theme.tokens), resolved: parse(theme.resolved) };
    }

    async checkReachability(url: string): Promise<ReachabilityDto> {
        const response = await this.client.execute<{
            componentExtractionCheckReachability: GqlEnvelope<ReachabilityDto>;
        }>({ query: CHECK_REACHABILITY, variables: { url } });

        return unwrap(response.componentExtractionCheckReachability) as ReachabilityDto;
    }

    async listStageLogs(taskId: string): Promise<StageTaskTrail> {
        const response = await this.client.execute<{
            backgroundTasks: {
                getTask: GqlEnvelope<{ id: string; output: StageTaskOutput | null }>;
            };
        }>({ query: GET_STAGE_TASK, variables: { id: taskId } });

        const task = unwrap(response.backgroundTasks.getTask);
        const activity = task?.output?.activity ?? [];
        return {
            logs: activity.map(entry => ({
                message: entry.message,
                type: "info",
                createdOn: entry.at
            })),
            progress: task?.output?.progress ?? null
        };
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

    async getComponentPrompt(runId: string, signature: string): Promise<unknown> {
        const response = await this.client.execute<{
            componentExtractionGetComponentPrompt: GqlEnvelope<unknown>;
        }>({ query: GET_COMPONENT_PROMPT, variables: { runId, signature } });

        return unwrap(response.componentExtractionGetComponentPrompt);
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

    async recapturePages(runId: string, urls: string[]): Promise<StageTriggerResult> {
        const response = await this.client.execute<{
            componentExtractionRecapturePages: GqlEnvelope<StageTriggerResult>;
        }>({ query: RECAPTURE_PAGES, variables: { runId, urls } });

        return unwrap(response.componentExtractionRecapturePages);
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

    async getPageMap(runId: string, tenantId?: string): Promise<PageMapDto | null> {
        const response = await this.client.execute<{
            pageCompositionPocPageMap: GqlEnvelope<PageMapDto | null>;
        }>({ query: GET_PAGE_MAP, variables: { runId, tenantId: tenantId ?? null } });

        return unwrap(response.pageCompositionPocPageMap) ?? null;
    }

    async getSiteLivePageIds(
        jobId: string,
        paths: string[]
    ): Promise<Record<string, string | null>> {
        if (paths.length === 0) {
            return {};
        }
        const response = await this.client.execute<{
            pageCompositionPocSiteLivePages: GqlEnvelope<Record<string, string | null> | null>;
        }>({ query: GET_SITE_LIVE_PAGES, variables: { jobId, paths } });

        return unwrap(response.pageCompositionPocSiteLivePages) ?? {};
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

    async cancelRun(runId: string): Promise<void> {
        const response = await this.client.execute<{
            componentExtractionCancelRun: { error: { message: string } | null };
        }>({ query: CANCEL_RUN, variables: { runId } });

        if (response.componentExtractionCancelRun.error) {
            throw new Error(response.componentExtractionCancelRun.error.message);
        }
    }

    async buildSite(runId: string): Promise<{ taskId: string; runId: string }> {
        const response = await this.client.execute<{
            pageCompositionPocBuildSite: GqlEnvelope<{ taskId: string; runId: string }>;
        }>({ query: BUILD_SITE, variables: { runId } });

        return unwrap(response.pageCompositionPocBuildSite);
    }

    async getSite(jobId: string): Promise<SiteDto | null> {
        const response = await this.client.execute<{
            pageCompositionPocSite: GqlEnvelope<SiteDto | null>;
        }>({ query: GET_SITE, variables: { jobId } });

        return unwrap(response.pageCompositionPocSite) ?? null;
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
            websiteBuilder: { getSettings: GqlEnvelope<{ domain: string } | null> };
        }>({ query: GET_WEBSITE_DOMAIN });

        // Trailing slashes removed here, where the value is read, so joining it with a page path
        // (which always starts with "/") can never produce a double slash.
        // `domain` since the frontend-settings port (it was `previewDomain`; the old field name made
        // this query fail and every "Open" link go nowhere).
        const domain = unwrap(response.websiteBuilder.getSettings)?.domain ?? "";
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

    async generateComponents(
        runId: string,
        signatures: string[]
    ): Promise<{ tasks: { signature: string; taskId: string }[] }> {
        const response = await this.client.execute<{
            componentExtractionGenerateComponents: GqlEnvelope<{
                tasks: { signature: string; taskId: string }[];
            }>;
        }>({ query: GENERATE_COMPONENTS, variables: { runId, signatures } });

        return unwrap(response.componentExtractionGenerateComponents);
    }

    async getTaskStatus(taskId: string): Promise<string | null> {
        const response = await this.client.execute<{
            backgroundTasks: { getTask: GqlEnvelope<{ id: string; taskStatus: string } | null> };
        }>({ query: GET_TASK_STATUS, variables: { id: taskId } });

        return unwrap(response.backgroundTasks.getTask)?.taskStatus ?? null;
    }

    async getGenerationLog(runId: string, signature: string): Promise<GenerationLogDto> {
        const response = await this.client.execute<{
            componentExtractionGetGenerationLog: GqlEnvelope<GenerationLogDto>;
        }>({ query: GET_GENERATION_LOG, variables: { runId, signature } });

        return unwrap(response.componentExtractionGetGenerationLog);
    }

    async getGenerationPrompt(
        runId: string,
        signature: string,
        entryId: string
    ): Promise<GenerationPromptDto | null> {
        const response = await this.client.execute<{
            componentExtractionGetGenerationPrompt: GqlEnvelope<GenerationPromptDto | null>;
        }>({ query: GET_GENERATION_PROMPT, variables: { runId, signature, entryId } });

        return unwrap(response.componentExtractionGetGenerationPrompt);
    }

    async getReviews(runId: string): Promise<ReviewsDto> {
        const response = await this.client.execute<{
            componentExtractionGetReviews: GqlEnvelope<ReviewsDto>;
        }>({ query: GET_REVIEWS, variables: { runId } });

        return unwrap(response.componentExtractionGetReviews);
    }

    async setComponentReview(
        runId: string,
        signature: string,
        review: ReviewInputDto
    ): Promise<ReviewsDto> {
        const response = await this.client.execute<{
            componentExtractionSetComponentReview: GqlEnvelope<ReviewsDto>;
        }>({
            query: SET_COMPONENT_REVIEW,
            variables: { runId, signature, ...review }
        });

        return unwrap(response.componentExtractionSetComponentReview);
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
