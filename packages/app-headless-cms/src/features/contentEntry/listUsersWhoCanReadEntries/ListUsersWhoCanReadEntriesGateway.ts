import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse } from "~/types.js";
import {
    ListUsersWhoCanReadEntriesGateway as GatewayAbstraction,
    type CmsEntriesReader
} from "./abstractions.js";

interface ListUsersWhoCanReadEntriesResponse {
    readers: {
        data: CmsEntriesReader[] | null;
        error: CmsErrorResponse | null;
    };
}

const LIST_USERS_WHO_CAN_READ_ENTRIES = /* GraphQL */ `
    query CmsListUsersWhoCanReadEntries($modelId: ID!) {
        readers: listUsersWhoCanReadEntries(modelId: $modelId) {
            data {
                id
                displayName
            }
            error {
                code
                data
                message
            }
        }
    }
`;

class ListUsersWhoCanReadEntriesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute(modelId: string): Promise<CmsEntriesReader[]> {
        const response = await this.client.execute<ListUsersWhoCanReadEntriesResponse>({
            query: LIST_USERS_WHO_CAN_READ_ENTRIES,
            variables: { modelId }
        });

        const { data, error } = response.readers;

        if (!data) {
            throw new Error(error?.message || "Could not list the users who can read entries");
        }

        return data;
    }
}

export const ListUsersWhoCanReadEntriesGateway = GatewayAbstraction.createImplementation({
    implementation: ListUsersWhoCanReadEntriesGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
