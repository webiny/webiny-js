import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { DeleteApiKeyGateway as GatewayAbstraction } from "./abstractions.js";

const DELETE_API_KEY = /* GraphQL */ `
    mutation DeleteApiKey($id: ID!) {
        security {
            deleteApiKey(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

interface DeleteApiKeyResponse {
    security: {
        deleteApiKey: {
            data: boolean | null;
            error: { code: string; message: string } | null;
        };
    };
}

class DeleteApiKeyGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string): Promise<void> {
        const response = await this.client.execute<DeleteApiKeyResponse>({
            query: DELETE_API_KEY,
            variables: { id }
        });

        const { error } = response.security.deleteApiKey;

        if (error) {
            throw new Error(error.message);
        }
    }
}

export const DeleteApiKeyGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteApiKeyGatewayImpl,
    dependencies: [MainGraphQLClient]
});
