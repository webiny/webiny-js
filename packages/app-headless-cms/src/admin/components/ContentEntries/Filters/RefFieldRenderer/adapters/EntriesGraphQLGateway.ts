import type { ApolloClient } from "@apollo/client";
import type { EntriesGatewayInterface } from "./EntriesGatewayInterface.js";
import { GET_CONTENT_ENTRY, SEARCH_CONTENT_ENTRIES } from "./entries.gql.js";
import type {
    GetEntryQueryVariables,
    GetEntryResponse,
    ListEntriesQueryVariables,
    ListEntriesResponse
} from "./entries.types.js";

export class EntriesGraphQLGateway implements EntriesGatewayInterface {
    private client: ApolloClient;

    constructor(client: ApolloClient) {
        this.client = client;
    }

    async list(modelIds: string[], query?: string) {
        const { data: response } = await this.client.query<
            ListEntriesResponse,
            ListEntriesQueryVariables
        >({
            query: SEARCH_CONTENT_ENTRIES,
            variables: {
                modelIds,
                query,
                limit: 50
            },
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error("Network error while listing entries.");
        }

        const { data, error } = response.searchContentEntries;

        if (!data) {
            throw new Error(error?.message || "Could not fetch entries.");
        }

        return data;
    }

    async get(modelId: string, id: string) {
        const { data: response } = await this.client.query<
            GetEntryResponse,
            GetEntryQueryVariables
        >({
            query: GET_CONTENT_ENTRY,
            variables: {
                entry: {
                    modelId,
                    id
                }
            },
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error("Network error while getting entries.");
        }

        const { data, error } = response.getLatestContentEntry;

        if (!data) {
            throw new Error(error?.message || "Could not fetch entry.");
        }

        return data;
    }
}
