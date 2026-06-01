import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsMetaResponse } from "~/types.js";
import { createListQuery } from "@webiny/app-headless-cms-common";
import {
    ListEntriesGateway as GatewayAbstraction,
    type IListEntriesGatewayParams,
    type IListEntriesGatewayResult
} from "./abstractions.js";

interface ListEntriesResponse {
    content: {
        data: CmsContentEntry[] | null;
        meta: CmsMetaResponse;
        error: CmsErrorResponse | null;
    };
}

class ListEntriesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute(params: IListEntriesGatewayParams): Promise<IListEntriesGatewayResult> {
        const query = createListQuery(params.model);

        const response = await this.client.execute<ListEntriesResponse>({
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

        if (!data) {
            throw new Error(error?.message || "Could not list entries");
        }

        return { data, meta };
    }
}

export const ListEntriesGateway = GatewayAbstraction.createImplementation({
    implementation: ListEntriesGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
