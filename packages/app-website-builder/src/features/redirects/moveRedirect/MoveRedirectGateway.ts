import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import {
    MoveRedirectGateway as GatewayAbstraction,
    type MoveRedirectParams
} from "./abstractions.js";

const MOVE_REDIRECT = /* GraphQL */ `
    mutation MoveRedirect($id: ID!, $folderId: ID!) {
        websiteBuilder {
            moveRedirect(id: $id, folderId: $folderId) {
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

interface MoveRedirectResponse {
    websiteBuilder: {
        moveRedirect: {
            data: boolean | null;
            error: { code: string; message: string; data: unknown } | null;
        };
    };
}

class MoveRedirectGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: MoveRedirectParams): Promise<void> {
        const response = await this.client.execute<MoveRedirectResponse>({
            query: MOVE_REDIRECT,
            variables: { id: params.id, folderId: params.folderId }
        });

        const envelope = response.websiteBuilder.moveRedirect;

        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not move redirect.");
        }
    }
}

export const MoveRedirectGateway = GatewayAbstraction.createImplementation({
    implementation: MoveRedirectGatewayImpl,
    dependencies: [MainGraphQLClient]
});
