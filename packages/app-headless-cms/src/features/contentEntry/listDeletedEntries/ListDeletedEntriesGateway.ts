import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse, CmsMetaResponse, CmsModel } from "~/types.js";
import { EntryGraphQLFields } from "../abstractions.js";
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

function createQuery(model: CmsModel, fields: EntryGraphQLFields.Interface) {
    const queryName = `Deleted${model.pluralApiName}`;

    return /* GraphQL */ `
        query CmsEntriesList${queryName}($where: ${model.singularApiName}ListWhereInput, $sort: [${model.singularApiName}ListSorter], $limit: Int, $after: String, $search: String) {
            content: list${queryName}(where: $where, sort: $sort, limit: $limit, after: $after, search: $search) {
                data {
                    ${fields.getSystemFields(model)}
                    ${fields.getValuesBlock(model)}
                }
                meta { cursor hasMoreItems totalCount }
                error { message code data }
            }
        }
    `;
}

class ListDeletedEntriesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: CmsGraphQLClient.Interface,
        private fields: EntryGraphQLFields.Interface
    ) {}

    async execute(params: IListDeletedEntriesParams): Promise<IListDeletedEntriesResult> {
        const response = await this.client.execute<ListDeletedEntriesResponse>({
            query: createQuery(params.model, this.fields),
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
    dependencies: [CmsGraphQLClient, EntryGraphQLFields]
});
