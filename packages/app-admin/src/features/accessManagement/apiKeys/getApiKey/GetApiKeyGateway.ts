import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { ApiKey } from "../../types.js";
import { GetApiKeyGateway as GatewayAbstraction } from "./abstractions.js";

const GET_API_KEY = /* GraphQL */ `
    query GetApiKey($id: ID!) {
        security {
            apiKey: getApiKey(id: $id) {
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
                }
            }
        }
    }
`;

interface GetApiKeyResponse {
    security: {
        apiKey: {
            data: ApiKey | null;
            error: { code: string; message: string } | null;
        };
    };
}

class GetApiKeyGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string): Promise<ApiKey> {
        const response = await this.client.execute<GetApiKeyResponse>({
            query: GET_API_KEY,
            variables: { id }
        });

        const { data, error } = response.security.apiKey;

        if (error) {
            throw new Error(error.message);
        }

        if (!data) {
            throw new Error("API key not found.");
        }

        return data;
    }
}

export const GetApiKeyGateway = GatewayAbstraction.createImplementation({
    implementation: GetApiKeyGatewayImpl,
    dependencies: [MainGraphQLClient]
});
