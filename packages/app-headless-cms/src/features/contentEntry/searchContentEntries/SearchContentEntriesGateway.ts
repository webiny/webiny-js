import gql from "graphql-tag";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse } from "~/types.js";
import type { CmsReferenceEntry } from "../refTypes.js";
import { REFERENCE_ENTRY_FIELDS } from "../refTypes.js";
import {
    SearchContentEntriesGateway as GatewayAbstraction,
    type ISearchContentEntriesGatewayParams,
    type ISearchContentEntriesGatewayResult
} from "./abstractions.js";

interface SearchContentEntriesResponse {
    content: {
        data: CmsReferenceEntry[] | null;
        error: CmsErrorResponse | null;
    };
}

const SEARCH_CONTENT_ENTRIES = gql`
    query CmsSearchContentEntries($modelIds: [ID!]!, $query: String, $limit: Int) {
        content: searchContentEntries(modelIds: $modelIds, query: $query, limit: $limit) {
            ${REFERENCE_ENTRY_FIELDS}
        }
    }
`;

class SearchContentEntriesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute(
        params: ISearchContentEntriesGatewayParams
    ): Promise<ISearchContentEntriesGatewayResult> {
        const response = await this.client.execute<SearchContentEntriesResponse>({
            query: SEARCH_CONTENT_ENTRIES,
            variables: {
                modelIds: params.modelIds,
                query: params.query,
                limit: params.limit
            }
        });

        const { data, error } = response.content;

        if (!data) {
            throw new Error(error?.message || "Could not search content entries");
        }

        return { data };
    }
}

export const SearchContentEntriesGateway = GatewayAbstraction.createImplementation({
    implementation: SearchContentEntriesGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
