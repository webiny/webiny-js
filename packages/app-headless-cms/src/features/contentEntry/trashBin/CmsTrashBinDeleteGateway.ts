import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse } from "~/types.js";
import { createDeleteMutation } from "@webiny/app-headless-cms-common";
import {
    CmsTrashBinDeleteGateway as GatewayAbstraction,
    type ICmsTrashBinDeleteGatewayParams
} from "./abstractions.js";

interface DeleteEntryResponse {
    content: {
        data: boolean | null;
        error: CmsErrorResponse | null;
    };
}

class CmsTrashBinDeleteGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, id }: ICmsTrashBinDeleteGatewayParams): Promise<boolean> {
        const mutation = createDeleteMutation(model);

        const response = await this.client.execute<DeleteEntryResponse>({
            query: mutation,
            variables: { revision: id, permanently: true }
        });

        const { data, error } = response.content;

        if (!data) {
            throw new Error(error?.message || "Could not permanently delete the entry.");
        }

        return true;
    }
}

export const CmsTrashBinDeleteGateway = GatewayAbstraction.createImplementation({
    implementation: CmsTrashBinDeleteGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
