import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { ApiKey } from "../../types.js";
import {
    UpdateApiKeyGateway as GatewayAbstraction,
    type IUpdateApiKeyData
} from "./abstractions.js";

const UPDATE_API_KEY = /* GraphQL */ `
    mutation UpdateApiKey($id: ID!, $data: SecurityApiKeyInput!) {
        security {
            apiKey: updateApiKey(id: $id, data: $data) {
                data {
                    id
                    name
                    slug
                    description
                    token
                    permissions
                    createdOn
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

interface UpdateApiKeyResponse {
    security: {
        apiKey: {
            data: ApiKey | null;
            error: { code: string; message: string; data: unknown } | null;
        };
    };
}

class UpdateApiKeyGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string, data: IUpdateApiKeyData): Promise<ApiKey> {
        const response = await this.client.execute<UpdateApiKeyResponse>({
            query: UPDATE_API_KEY,
            variables: { id, data }
        });

        const { data: apiKey, error } = response.security.apiKey;

        if (error) {
            throw new Error(error.message);
        }

        if (!apiKey) {
            throw new Error("Failed to update API key.");
        }

        return apiKey;
    }
}

export const UpdateApiKeyGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateApiKeyGatewayImpl,
    dependencies: [MainGraphQLClient]
});
