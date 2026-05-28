import { DeletePageRevisionGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

const DELETE_PAGE_REVISION = /* GraphQL */ `
    mutation DeletePageRevision($id: ID!) {
        websiteBuilder {
            deletePageRevision(id: $id) {
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

type DeletePageRevisionResponse = {
    websiteBuilder: {
        deletePageRevision:
            | { data: boolean; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class DeletePageRevisionGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string, permanently: boolean) {
        const response = await this.client.execute<DeletePageRevisionResponse>({
            query: DELETE_PAGE_REVISION,
            variables: {
                id,
                permanently
            }
        });

        const envelope = response.websiteBuilder.deletePageRevision;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not delete page revision.");
        }
    }
}

export const DeletePageRevisionGateway = GatewayAbstraction.createImplementation({
    implementation: DeletePageRevisionGatewayImpl,
    dependencies: [MainGraphQLClient]
});
