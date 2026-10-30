import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse, CmsModel } from "~/types.js";
import {
    DeleteEntryRevisionGateway as GatewayAbstraction,
    type IDeleteEntryRevisionParams
} from "./abstractions.js";

interface DeleteEntryRevisionResponse {
    content: {
        data: boolean | null;
        error: CmsErrorResponse | null;
    };
}

function createMutation(model: CmsModel) {
    return /* GraphQL */ `
        mutation CmsEntriesDelete${model.singularApiName}($revision: ID!) {
            content: delete${model.singularApiName}(revision: $revision) {
                data
                error { message code data }
            }
        }
    `;
}

class DeleteEntryRevisionGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, revisionId }: IDeleteEntryRevisionParams) {
        const response = await this.client.execute<DeleteEntryRevisionResponse>({
            query: createMutation(model),
            variables: { revision: revisionId }
        });

        const { error } = response.content;

        if (error) {
            throw new GraphQLOperationError({
                message: error.message || "Could not delete entry revision",
                code: error.code,
                data: error.data
            });
        }

        return true;
    }
}

export const DeleteEntryRevisionGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteEntryRevisionGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
