import gql from "graphql-tag";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsMetaResponse } from "~/types.js";
import { createListQueryDataSelection } from "@webiny/app-headless-cms-common";
import {
    ListEntriesGateway as GatewayAbstraction,
    ListEntriesGraphQLFieldSelection,
    type IListEntriesGatewayParams,
    type IListEntriesGatewayResult,
    type IListEntriesGraphQLFieldSelection
} from "./abstractions.js";

interface ListEntriesResponse {
    content: {
        data: CmsContentEntry[] | null;
        meta: CmsMetaResponse;
        error: CmsErrorResponse | null;
    };
}

const ERROR_FIELD = /* GraphQL */ `
    {
        message
        code
        data
    }
`;

class ListEntriesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private fieldSelections: IListEntriesGraphQLFieldSelection[]
    ) {}

    async execute(params: IListEntriesGatewayParams): Promise<IListEntriesGatewayResult> {
        const extraSelection: string[] = [];
        for (const selection of this.fieldSelections) {
            extraSelection.push(...selection.getSelection());
        }

        const baseSelection = createListQueryDataSelection(params.model);
        const queryName = params.model.pluralApiName;

        const query = gql`
            query CmsEntriesList${queryName}($where: ${params.model.singularApiName}ListWhereInput, $sort: [${params.model.singularApiName}ListSorter], $limit: Int, $after: String, $search: String) {
                content: list${queryName}(
                    where: $where
                    sort: $sort
                    limit: $limit
                    after: $after
                    search: $search
                ) {
                    data {
                        ${baseSelection}
                        ${extraSelection.join("\n")}
                    }
                    meta {
                        cursor
                        hasMoreItems
                        totalCount
                    }
                    error ${ERROR_FIELD}
                }
            }
        `;

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
    dependencies: [CmsGraphQLClient, [ListEntriesGraphQLFieldSelection, { multiple: true }]]
});
