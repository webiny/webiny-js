import { MovePageGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

const MOVE_PAGE = /* GraphQL */ `
    mutation MovePage($id: ID!, $folderId: ID!) {
        websiteBuilder {
            movePage(id: $id, folderId: $folderId) {
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

type MovePageResponse = {
    websiteBuilder: {
        movePage:
            | { data: boolean; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class MovePageGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string, folderId: string) {
        const response = await this.client.execute<MovePageResponse>({
            query: MOVE_PAGE,
            variables: { id, folderId }
        });

        const envelope = response.websiteBuilder.movePage;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not move page.");
        }
    }
}

export const MovePageGateway = GatewayAbstraction.createImplementation({
    implementation: MovePageGatewayImpl,
    dependencies: [MainGraphQLClient]
});
