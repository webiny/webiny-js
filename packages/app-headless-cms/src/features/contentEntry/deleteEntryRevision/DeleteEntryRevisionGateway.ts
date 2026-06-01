import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse } from "~/types.js";
import { createDeleteMutation } from "@webiny/app-headless-cms-common";
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

class DeleteEntryRevisionGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, revisionId }: IDeleteEntryRevisionParams) {
        const mutation = createDeleteMutation(model);

        const response = await this.client.execute<DeleteEntryRevisionResponse>({
            query: mutation,
            variables: { revision: revisionId }
        });

        const { error } = response.content;

        if (error) {
            throw new Error(error.message || "Could not delete entry revision");
        }

        return true;
    }
}

export const DeleteEntryRevisionGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteEntryRevisionGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
