import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse } from "~/types.js";
import { createBulkActionMutation } from "@webiny/app-headless-cms-common";
import {
    CmsTrashBinBulkActionGateway as GatewayAbstraction,
    type ICmsTrashBinBulkActionGatewayParams,
    type ICmsTrashBinBulkActionGatewayResult
} from "./abstractions.js";

interface BulkActionResponse {
    content: {
        data: { id: string } | null;
        error: CmsErrorResponse | null;
    };
}

class CmsTrashBinBulkActionGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute(
        params: ICmsTrashBinBulkActionGatewayParams
    ): Promise<ICmsTrashBinBulkActionGatewayResult> {
        const mutation = createBulkActionMutation(params.model);

        const response = await this.client.execute<BulkActionResponse>({
            query: mutation,
            variables: {
                action: params.action,
                where: params.where,
                search: params.search
            }
        });

        const { data, error } = response.content;

        if (!data) {
            throw new Error(error?.message || "Could not perform the bulk action.");
        }

        return data;
    }
}

export const CmsTrashBinBulkActionGateway = GatewayAbstraction.createImplementation({
    implementation: CmsTrashBinBulkActionGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
