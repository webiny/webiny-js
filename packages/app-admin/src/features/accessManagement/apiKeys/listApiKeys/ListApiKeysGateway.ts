import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { ApiKey } from "../../types.js";
import {
    ListApiKeysGateway as GatewayAbstraction,
    type IListApiKeysGatewayResult
} from "./abstractions.js";

const API_KEY_FIELDS = `
    id
    name
    slug
    description
    token
    permissions
    createdOn
`;

const LIST_API_KEYS = /* GraphQL */ `
    query ListApiKeys {
        security {
            apiKeys: listApiKeys {
                data {
                    ${API_KEY_FIELDS}
                }
            }
        }
    }
`;

interface ListApiKeysResponse {
    security: {
        apiKeys: {
            data: ApiKey[];
        };
    };
}

class ListApiKeysGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<IListApiKeysGatewayResult> {
        const response = await this.client.execute<ListApiKeysResponse>({
            query: LIST_API_KEYS
        });

        return { data: response.security.apiKeys.data ?? [] };
    }
}

export const ListApiKeysGateway = GatewayAbstraction.createImplementation({
    implementation: ListApiKeysGatewayImpl,
    dependencies: [MainGraphQLClient]
});
