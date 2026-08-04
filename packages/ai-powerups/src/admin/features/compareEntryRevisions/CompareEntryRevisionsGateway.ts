import { CompareEntryRevisionsGateway as GatewayAbstraction } from "./abstractions.js";
import type { ICompareEntryRevisionsParams, ICompareEntryRevisionsResult } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/exports/admin.js";

interface CompareEntryRevisionsResponse {
    cms: {
        compareEntryRevisions: {
            data: ICompareEntryRevisionsResult | null;
            error: { message: string; code: string; data: unknown } | null;
        };
    };
}

const COMPARE_ENTRY_REVISIONS_QUERY = /* GraphQL */ `
    query CompareEntryRevisions($modelId: String!, $revisionId1: String!, $revisionId2: String!) {
        cms {
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
    }
`;

class CompareEntryRevisionsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: ICompareEntryRevisionsParams): Promise<ICompareEntryRevisionsResult> {
        const response = await this.client.execute<CompareEntryRevisionsResponse>({
            query: COMPARE_ENTRY_REVISIONS_QUERY,
            variables: params
        });

        const { data, error } = response.cms.compareEntryRevisions;

        if (!data || error) {
            throw new Error(error ? error.message : "Failed to compare revisions");
        }

        return data;
    }
}

export const CompareEntryRevisionsGateway = GatewayAbstraction.createImplementation({
    implementation: CompareEntryRevisionsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
