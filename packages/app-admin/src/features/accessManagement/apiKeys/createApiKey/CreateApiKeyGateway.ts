import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { ApiKey } from "../../types.js";
import {
    CreateApiKeyGateway as GatewayAbstraction,
    type ICreateApiKeyData
} from "./abstractions.js";

const CREATE_API_KEY = /* GraphQL */ `
    mutation CreateApiKey($data: SecurityApiKeyInput!) {
        security {
            apiKey: createApiKey(data: $data) {
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

interface CreateApiKeyResponse {
    security: {
        apiKey: {
            data: ApiKey | null;
            error: { code: string; message: string; data: unknown } | null;
        };
    };
}

class CreateApiKeyGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(data: ICreateApiKeyData): Promise<ApiKey> {
        const response = await this.client.execute<CreateApiKeyResponse>({
            query: CREATE_API_KEY,
            variables: { data }
        });

        const { data: apiKey, error } = response.security.apiKey;

        if (error) {
            throw new Error(error.message);
        }

        if (!apiKey) {
            throw new Error("Failed to create API key.");
        }

        return apiKey;
    }
}

export const CreateApiKeyGateway = GatewayAbstraction.createImplementation({
    implementation: CreateApiKeyGatewayImpl,
    dependencies: [MainGraphQLClient]
});
