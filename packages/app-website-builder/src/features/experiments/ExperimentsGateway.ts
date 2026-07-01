import { ExperimentsGateway as GatewayAbstraction } from "./abstractions.js";
import type {
    CreateExperimentInput,
    ExperimentDto,
    UpdateExperimentInput,
    VariantDto
} from "./types.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

const EXPERIMENT_FIELDS = /* GraphQL */ `
    id
    entryId
    pageEntryId
    baselineRevisionId
    status
    name
    trafficSplit
    targeting
    analytics
    startedOn
    stoppedOn
    winningVariantId
`;

const VARIANT_FIELDS = /* GraphQL */ `
    id
    entryId
    experimentId
    name
    status
`;

const ERROR_FIELDS = /* GraphQL */ `
    code
    message
    data
`;

type Envelope<T> = { data: T; error: null } | { data: null; error: { message: string } };

class ExperimentsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    private unwrap<T>(envelope: Envelope<T>, fallbackMessage: string): T {
        if (envelope.error) {
            throw new Error(envelope.error.message || fallbackMessage);
        }
        return envelope.data as T;
    }

    async listExperiments(pageEntryId: string): Promise<ExperimentDto[]> {
        const response = await this.client.execute<{
            websiteBuilder: { listExperiments: Envelope<ExperimentDto[]> };
        }>({
            query: /* GraphQL */ `
                query ListExperiments($pageEntryId: String!) {
                    websiteBuilder {
                        listExperiments(pageEntryId: $pageEntryId) {
                            data { ${EXPERIMENT_FIELDS} }
                            error { ${ERROR_FIELDS} }
                        }
                    }
                }
            `,
            variables: { pageEntryId }
        });
        return (
            this.unwrap(response.websiteBuilder.listExperiments, "Could not list experiments.") ??
            []
        );
    }

    async getExperiment(id: string): Promise<ExperimentDto | null> {
        const response = await this.client.execute<{
            websiteBuilder: { getExperiment: Envelope<ExperimentDto | null> };
        }>({
            query: /* GraphQL */ `
                query GetExperiment($id: ID!) {
                    websiteBuilder {
                        getExperiment(id: $id) {
                            data { ${EXPERIMENT_FIELDS} }
                            error { ${ERROR_FIELDS} }
                        }
                    }
                }
            `,
            variables: { id }
        });
        return this.unwrap(response.websiteBuilder.getExperiment, "Could not load experiment.");
    }

    async listVariants(experimentId: string): Promise<VariantDto[]> {
        const response = await this.client.execute<{
            websiteBuilder: { listVariants: Envelope<VariantDto[]> };
        }>({
            query: /* GraphQL */ `
                query ListVariants($experimentId: String!) {
                    websiteBuilder {
                        listVariants(experimentId: $experimentId) {
                            data { ${VARIANT_FIELDS} }
                            error { ${ERROR_FIELDS} }
                        }
                    }
                }
            `,
            variables: { experimentId }
        });
        return this.unwrap(response.websiteBuilder.listVariants, "Could not list variants.") ?? [];
    }

    async createExperiment(input: CreateExperimentInput): Promise<ExperimentDto> {
        const response = await this.client.execute<{
            websiteBuilder: { createExperiment: Envelope<ExperimentDto> };
        }>({
            query: /* GraphQL */ `
                mutation CreateExperiment($data: WbExperimentCreateInput!) {
                    websiteBuilder {
                        createExperiment(data: $data) {
                            data { ${EXPERIMENT_FIELDS} }
                            error { ${ERROR_FIELDS} }
                        }
                    }
                }
            `,
            variables: { data: input }
        });
        return this.unwrap(
            response.websiteBuilder.createExperiment,
            "Could not create experiment."
        );
    }

    async updateExperiment(id: string, input: UpdateExperimentInput): Promise<ExperimentDto> {
        const response = await this.client.execute<{
            websiteBuilder: { updateExperiment: Envelope<ExperimentDto> };
        }>({
            query: /* GraphQL */ `
                mutation UpdateExperiment($id: ID!, $data: WbExperimentUpdateInput!) {
                    websiteBuilder {
                        updateExperiment(id: $id, data: $data) {
                            data { ${EXPERIMENT_FIELDS} }
                            error { ${ERROR_FIELDS} }
                        }
                    }
                }
            `,
            variables: { id, data: input }
        });
        return this.unwrap(
            response.websiteBuilder.updateExperiment,
            "Could not update experiment."
        );
    }

    async createVariant(input: { experimentId: string; name: string }): Promise<VariantDto> {
        const response = await this.client.execute<{
            websiteBuilder: { createVariant: Envelope<VariantDto> };
        }>({
            query: /* GraphQL */ `
                mutation CreateVariant($data: WbVariantCreateInput!) {
                    websiteBuilder {
                        createVariant(data: $data) {
                            data { ${VARIANT_FIELDS} }
                            error { ${ERROR_FIELDS} }
                        }
                    }
                }
            `,
            variables: { data: input }
        });
        return this.unwrap(response.websiteBuilder.createVariant, "Could not create variant.");
    }

    async updateVariant(
        id: string,
        input: { name?: string; status?: string }
    ): Promise<VariantDto> {
        const response = await this.client.execute<{
            websiteBuilder: { updateVariant: Envelope<VariantDto> };
        }>({
            query: /* GraphQL */ `
                mutation UpdateVariant($id: ID!, $data: WbVariantUpdateInput!) {
                    websiteBuilder {
                        updateVariant(id: $id, data: $data) {
                            data { ${VARIANT_FIELDS} }
                            error { ${ERROR_FIELDS} }
                        }
                    }
                }
            `,
            variables: { id, data: input }
        });
        return this.unwrap(response.websiteBuilder.updateVariant, "Could not update variant.");
    }

    async deleteVariant(id: string): Promise<boolean> {
        const response = await this.client.execute<{
            websiteBuilder: { deleteVariant: Envelope<boolean> };
        }>({
            query: /* GraphQL */ `
                mutation DeleteVariant($id: ID!) {
                    websiteBuilder {
                        deleteVariant(id: $id) {
                            data
                            error { ${ERROR_FIELDS} }
                        }
                    }
                }
            `,
            variables: { id }
        });
        return (
            this.unwrap(response.websiteBuilder.deleteVariant, "Could not delete variant.") ?? false
        );
    }
}

export const ExperimentsGateway = GatewayAbstraction.createImplementation({
    implementation: ExperimentsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
