import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import {
    DeleteRedirectGateway as GatewayAbstraction,
    type DeleteRedirectParams
} from "./abstractions.js";

const DELETE_REDIRECT = /* GraphQL */ `
    mutation DeleteRedirect($id: ID!) {
        websiteBuilder {
            deleteRedirect(id: $id) {
                data
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;

interface DeleteRedirectResponse {
    websiteBuilder: {
        deleteRedirect: {
            data: boolean | null;
            error: { code: string; message: string; data: unknown } | null;
        };
    };
}

class DeleteRedirectGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: DeleteRedirectParams): Promise<void> {
        const response = await this.client.execute<DeleteRedirectResponse>({
            query: DELETE_REDIRECT,
            variables: { id: params.id }
        });

        const envelope = response.websiteBuilder.deleteRedirect;

        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not delete redirect.");
        }
    }
}

export const DeleteRedirectGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteRedirectGatewayImpl,
    dependencies: [MainGraphQLClient]
});
