import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse } from "~/types.js";
import { createDeleteMutation } from "@webiny/app-headless-cms-common";
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

class DeleteEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, id }: IDeleteEntryParams) {
        const mutation = createDeleteMutation(model);

        const response = await this.client.execute<DeleteEntryResponse>({
            query: mutation,
            variables: { revision: id, permanently: false }
        });

        const { error } = response.content;

        if (error) {
            throw new Error(error.message || "Could not delete entry");
        }

        return true;
    }
}

export const DeleteEntryGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteEntryGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
