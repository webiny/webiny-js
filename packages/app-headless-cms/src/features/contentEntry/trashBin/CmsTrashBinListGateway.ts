import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsMetaResponse } from "~/types.js";
import { createListQuery } from "@webiny/app-headless-cms-common";
import {
    CmsTrashBinListGateway as GatewayAbstraction,
    type ICmsTrashBinListGatewayParams,
    type ICmsTrashBinListGatewayResult
} from "./abstractions.js";

interface ListDeletedEntriesResponse {
    content: {
        data: CmsContentEntry[] | null;
        meta: CmsMetaResponse;
        error: CmsErrorResponse | null;
    };
}

class CmsTrashBinListGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute(params: ICmsTrashBinListGatewayParams): Promise<ICmsTrashBinListGatewayResult> {
        const fields = params.model.fields.filter(field => {
            return ["text", "number", "boolean", "file", "long-text", "ref", "datetime"].includes(
                field.type
            );
        });

        const query = createListQuery(params.model, fields, true);

        const response = await this.client.execute<ListDeletedEntriesResponse>({
            query,
            variables: {
                where: params.where,
                sort: params.sort,
                limit: params.limit,
                after: params.after,
                search: params.search
            }
        });

        const { data, meta, error } = response.content;

        if (!data && !meta) {
            throw new Error(error?.message || "Could not fetch deleted entries.");
        }

        return {
            data: data || [],
            meta: {
                cursor: meta.cursor,
                hasMoreItems: meta.hasMoreItems,
                totalCount: meta.totalCount
            }
        };
    }
}

export const CmsTrashBinListGateway = GatewayAbstraction.createImplementation({
    implementation: CmsTrashBinListGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
