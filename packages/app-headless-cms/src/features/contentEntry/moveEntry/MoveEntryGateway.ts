import gql from "graphql-tag";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse, CmsModel } from "~/types.js";
import { MoveEntryGateway as GatewayAbstraction, type IMoveEntryParams } from "./abstractions.js";

function createMoveMutation(model: CmsModel) {
    return gql`
        mutation CmsMove${model.singularApiName}($revision: ID!, $folderId: ID!) {
            content: move${model.singularApiName}(revision: $revision, folderId: $folderId) {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    `;
}

interface MoveEntryResponse {
    content: {
        data: boolean | null;
        error: CmsErrorResponse | null;
    };
}

class MoveEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, id, folderId }: IMoveEntryParams) {
        const mutation = createMoveMutation(model);

        const response = await this.client.execute<MoveEntryResponse>({
            query: mutation,
            variables: { revision: id, folderId }
        });

        const { error } = response.content;

        if (error) {
            throw new Error(error.message || "Could not move entry");
        }

        return true;
    }
}

export const MoveEntryGateway = GatewayAbstraction.createImplementation({
    implementation: MoveEntryGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
