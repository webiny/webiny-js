import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsMetaResponse } from "~/types.js";
import { EntryGraphQLFields } from "../abstractions.js";
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

class ListEntriesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private fieldSelections: IListEntriesGraphQLFieldSelection[],
        private fields: EntryGraphQLFields.Interface
    ) {}

    async execute(params: IListEntriesGatewayParams): Promise<IListEntriesGatewayResult> {
        const extraSelection: string[] = [];
        for (const selection of this.fieldSelections) {
            extraSelection.push(...selection.getSelection());
        }

        const queryName = params.model.pluralApiName;

        const query = /* GraphQL */ `
            query CmsEntriesList${queryName}($where: ${params.model.singularApiName}ListWhereInput, $sort: [${params.model.singularApiName}ListSorter], $limit: Int, $after: String, $search: String) {
                content: list${queryName}(where: $where, sort: $sort, limit: $limit, after: $after, search: $search) {
                    data {
                        ${this.fields.getSystemFields(params.model)}
                        ${this.fields.getValuesBlock(params.model)}
                        ${extraSelection.join("\n")}
                    }
                    meta { cursor hasMoreItems totalCount }
                    error { message code data }
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
    dependencies: [
        CmsGraphQLClient,
        [ListEntriesGraphQLFieldSelection, { multiple: true }],
        EntryGraphQLFields
    ]
});
