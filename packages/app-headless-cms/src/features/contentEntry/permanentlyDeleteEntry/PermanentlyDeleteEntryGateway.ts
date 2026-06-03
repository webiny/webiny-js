import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse } from "~/types.js";
import { createDeleteMutation } from "@webiny/app-headless-cms-common";
import {
    PermanentlyDeleteEntryGateway as GatewayAbstraction,
    type IPermanentlyDeleteEntryParams
} from "./abstractions.js";

interface DeleteEntryResponse {
    content: {
        data: boolean | null;
        error: CmsErrorResponse | null;
    };
}

class PermanentlyDeleteEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, id }: IPermanentlyDeleteEntryParams): Promise<boolean> {
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

export const PermanentlyDeleteEntryGateway = GatewayAbstraction.createImplementation({
    implementation: PermanentlyDeleteEntryGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
