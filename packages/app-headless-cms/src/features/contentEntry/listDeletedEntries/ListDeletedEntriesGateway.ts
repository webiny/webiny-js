import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsMetaResponse } from "~/types.js";
import { createListQuery } from "@webiny/app-headless-cms-common";
import {
    ListDeletedEntriesGateway as GatewayAbstraction,
    type IListDeletedEntriesParams,
    type IListDeletedEntriesResult
} from "./abstractions.js";

interface ListDeletedEntriesResponse {
    content: {
        data: CmsContentEntry[] | null;
        meta: CmsMetaResponse;
        error: CmsErrorResponse | null;
    };
}

class ListDeletedEntriesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute(params: IListDeletedEntriesParams): Promise<IListDeletedEntriesResult> {
        const query = createListQuery(params.model, undefined, true);

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
            meta
        };
    }
}

export const ListDeletedEntriesGateway = GatewayAbstraction.createImplementation({
    implementation: ListDeletedEntriesGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
