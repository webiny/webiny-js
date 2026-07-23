import { MainGraphQLClient } from "webiny/admin";
import { CompareRevisionsGateway } from "./abstractions.js";
import type { ICompareRevisionsResult } from "./abstractions.js";

interface CompareRevisionsResponse {
    compareEntryRevisions: {
        data: ICompareRevisionsResult | null;
        error: { message: string; code: string; data: unknown } | null;
    };
}

const COMPARE_REVISIONS_QUERY = /* GraphQL */ `
    query CompareRevisions($modelId: String!, $revisionId1: String!, $revisionId2: String!) {
        compareEntryRevisions(
            modelId: $modelId
            revisionId1: $revisionId1
            revisionId2: $revisionId2
        ) {
            data {
                html
                summary
            }
            error {
                message
                code
                data
            }
        }
    }
`;

class CompareRevisionsGatewayImpl implements CompareRevisionsGateway.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: {
        modelId: string;
        revisionId1: string;
        revisionId2: string;
    }): Promise<ICompareRevisionsResult> {
        const response = await this.client.execute<CompareRevisionsResponse>({
            query: COMPARE_REVISIONS_QUERY,
            variables: params
        });

        const { data, error } = response.compareEntryRevisions;

        if (!data || error) {
            throw new Error(error ? error.message : "Failed to compare revisions");
        }

        return data;
    }
}

export const CompareRevisionsGatewayImplementation = CompareRevisionsGateway.createImplementation({
    implementation: CompareRevisionsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
