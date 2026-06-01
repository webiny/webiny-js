import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse } from "~/types.js";
import { createBulkActionMutation } from "@webiny/app-headless-cms-common";
import {
    BulkActionGateway as GatewayAbstraction,
    type IBulkActionParams,
    type IBulkActionResult
} from "./abstractions.js";

interface BulkActionResponse {
    content: {
        data: IBulkActionResult | null;
        error: CmsErrorResponse | null;
    };
}

class BulkActionGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, action, where, search, data }: IBulkActionParams) {
        const mutation = createBulkActionMutation(model);

        const response = await this.client.execute<BulkActionResponse>({
            query: mutation,
            variables: { action, where, search, data }
        });

        const { data: result, error } = response.content;

        if (!result) {
            throw new Error(error?.message || "Bulk action failed");
        }

        return result;
    }
}

export const BulkActionGateway = GatewayAbstraction.createImplementation({
    implementation: BulkActionGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
