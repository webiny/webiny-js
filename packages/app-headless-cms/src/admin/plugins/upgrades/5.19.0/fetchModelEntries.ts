import { CmsEditorContentEntry, CmsEditorContentModel } from "~/types";
import { ApolloClient } from "apollo-client";
import { createListEntriesQuery } from "~/admin/plugins/upgrades/5.19.0/createListEntriesQuery";

interface FetchEntriesParams {
    client: ApolloClient<any>;
    query: any;
    variables: {
        limit: number;
        after: string | null;
        where: Record<string, string>;
    };
}
interface FetchEntriesResult {
    hasMoreItems: boolean;
    totalCount: number;
    items: CmsEditorContentEntry[];
    cursor: string | null;
}
const fetchEntries = async (params: FetchEntriesParams): Promise<FetchEntriesResult | null> => {
    const { client, query, variables } = params;
    const response = await client.query({
        query,
        variables
    });
    const { data: items, error, meta } = response.data.content;
    if (error) {
        console.error(error.message);
        return null;
    }

    return {
        items: items || [],
        hasMoreItems: meta.hasMoreItems,
        cursor: meta.cursor,
        totalCount: meta.totalCount
    };
};

export interface Params {
    model: CmsEditorContentModel;
    client: ApolloClient<any>;
}
export const fetchModelEntries = async (params: Params): Promise<string[]> => {
    const { model, client } = params;
    const items: string[] = [];

    const query = createListEntriesQuery(model);

    const variables = {
        limit: 100,
        after: null,
        where: {}
    };
    let result: FetchEntriesResult;
    while ((result = await fetchEntries({ client, query, variables }))) {
        if (!result) {
            return items;
        }
        items.push(...result.items.map(item => item.id));

        if (result.hasMoreItems === false) {
            return items;
        }
        variables.after = result.cursor;
    }
    return items;
};
