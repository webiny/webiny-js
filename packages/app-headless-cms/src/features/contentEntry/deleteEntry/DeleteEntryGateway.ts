import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse, CmsModel } from "~/types.js";
import {
    DeleteEntryGateway as GatewayAbstraction,
    type IDeleteEntryParams
} from "./abstractions.js";

interface DeleteEntryResponse {
    content: {
        data: boolean | null;
        error: CmsErrorResponse | null;
    };
}

function createMutation(model: CmsModel) {
    return /* GraphQL */ `
        mutation CmsEntriesDelete${model.singularApiName}($revision: ID!, $permanently: Boolean) {
            content: delete${model.singularApiName}(revision: $revision, options: {permanently: $permanently}) {
                data
                error { message code data }
            }
        }
    `;
}

class DeleteEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, id }: IDeleteEntryParams) {
        const response = await this.client.execute<DeleteEntryResponse>({
            query: createMutation(model),
            variables: { revision: id, permanently: false }
        });

        const { error } = response.content;

        if (error) {
            throw new GraphQLOperationError({
                message: error.message || "Could not delete entry",
                code: error.code,
                data: error.data
            });
        }

        return true;
    }
}

export const DeleteEntryGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteEntryGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
