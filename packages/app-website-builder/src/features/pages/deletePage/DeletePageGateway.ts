import { DeletePageGateway as GatewayAbstraction } from "./abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

const DELETE_PAGE = /* GraphQL */ `
    mutation DeletePage($id: ID!) {
        websiteBuilder {
            deletePage(id: $id) {
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

type DeletePageResponse = {
    websiteBuilder: {
        deletePage:
            | { data: boolean; error: null }
            | { data: null; error: { code: string; message: string; data: any } };
    };
};

class DeletePageGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string, permanently: boolean) {
        const response = await this.client.execute<DeletePageResponse>({
            query: DELETE_PAGE,
            variables: { id, permanently }
        });

        const envelope = response.websiteBuilder.deletePage;
        if (envelope.error) {
            throw new Error(envelope.error.message || "Could not delete page.");
        }
    }
}

export const DeletePageGateway = GatewayAbstraction.createImplementation({
    implementation: DeletePageGatewayImpl,
    dependencies: [MainGraphQLClient]
});
