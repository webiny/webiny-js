import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { ComponentExtractionGateway, type StageTriggerResult } from "./abstractions.js";
import type {
    CreateJobData,
    JobDto,
    JobListItemDto,
    RunDto,
    ThemeOptionDto
} from "~/shared/types.js";
import {
    CREATE_JOB,
    CREATE_RUN,
    GET_JOB,
    GET_RUN,
    LIST_JOBS,
    LIST_RUNS,
    LIST_THEMES,
    RUN_STAGE
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
}

export const ComponentExtractionGraphQLGateway = ComponentExtractionGateway.createImplementation({
    implementation: ComponentExtractionGraphQLGatewayImpl,
    dependencies: [MainGraphQLClient]
});
