import dotProp from "dot-prop-immutable";
import orderBy from "lodash/orderBy";
import get from "lodash/get";
import { PbPageData, PbPageRevision } from "~/types";
import * as GQL from "~/admin/graphql/pages";
import { DataProxy } from "apollo-cache";

interface PageListVariables {
    sort?: string;
    search?: {
        query?: string;
    };
    where?: {
        category?: string;
        status?: string;
    };
    // [key: string]: any;
}

export const readPageListVariables = (): PageListVariables => {
    let variables;

    const item = localStorage.getItem("webiny_pb_pages_list_latest_variables") || "";
    try {
        variables = JSON.parse(item);
    } catch {}

    return variables;
};

export const writePageListVariablesToLocalStorage = (variables: PageListVariables): void => {
    // Needs to be refactored. Possibly, with our own GQL client, this is going to be much easier to handle.
    localStorage.setItem("webiny_pb_pages_list_latest_variables", JSON.stringify(variables));
};

const extractVariables = (key: string): PageListVariables => {
    // TODO: Find a better way to parse the query/id from cache
    const variables = key.replace("$ROOT_QUERY.pageBuilder.listPages(", "").replace(")", "");
    return JSON.parse(variables);
};

const modifyCacheForAllListPagesQuery = (
    cache: DataProxy,
    operation: (variables: PageListVariables) => void
) => {
    /**
     * Figure out correct type for cache object because DataProxy does not have data type on it.
     */
    // @ts-expect-error
    const existingQueriesInCache = Object.keys(cache.data.data).filter(
        key => key.includes(".listPages") && !key.endsWith(".meta")
    );

    existingQueriesInCache.forEach(cacheKey => {
        const variables = extractVariables(cacheKey);
        operation(variables);
    });
};

/*
 * We need to preserve the order of entries with new entry addition
 * because we're not re-fetching the list but updating it directly inside cache.
 * */
const sortEntries = (list: PbPageData[], sort?: string) => {
    if (!sort) {
        return list;
    }
    const [sortBy, orderByValue] = sort.split("_");
    const order = orderByValue.toLowerCase() as "asc" | "desc";
    return orderBy(list, [sortBy], [order]);
};

export const addPageToListCache = (cache: DataProxy, page: PbPageData): void => {
    modifyCacheForAllListPagesQuery(cache, variables => {
        const gqlParams = { query: GQL.LIST_PAGES, variables };
        const data = cache.readQuery(gqlParams);
        const listPagesData = get(data, "pageBuilder.listPages.data") as unknown as PbPageData[];
        if (!listPagesData) {
            return;
        }

        cache.writeQuery({
            ...gqlParams,
            data: dotProp.set(
                data,
                "pageBuilder.listPages.data",
                sortEntries([page, ...listPagesData], variables.sort)
            )
        });
    });
};

/*
 * Since ACO is using GET_PAGE instead of LIST_PAGES to fetch pages information, we need to bind the newly created revision id
 * to the exising entry cache. Otherwise, the page list continues to show the previous revision data.
 */
const addRevisionIdToEntryCache = (cache: DataProxy, revision: PbPageRevision): void => {
    try {
        const gqlParams = {
            query: GQL.GET_PAGE,
            variables: { id: revision.pid }
        };

        const data = cache.readQuery(gqlParams);

        if (!data) {
            return;
        }

        cache.writeQuery({
            ...gqlParams,
            data: dotProp.set(data, "pageBuilder.getPage.data.id", revision.id)
        });
    } catch {
        /*
         * In case the update is performed by the previous DataList view,
         * this will throw an error because it won't find the `GET_PAGE` entry in cache to update.
         */
        return;
    }
};

export const updateLatestRevisionInListCache = (
    cache: DataProxy,
    revision: PbPageRevision
): void => {
    addRevisionIdToEntryCache(cache, revision);
    modifyCacheForAllListPagesQuery(cache, variables => {
        const gqlParams = { query: GQL.LIST_PAGES, variables };
        const data = cache.readQuery(gqlParams);

        const listPagesData = get(data, "pageBuilder.listPages.data") as unknown as PbPageData[];
        if (!listPagesData) {
            return;
        }

        const [uniqueId] = revision.id.split("#");
        const index = listPagesData.findIndex(item => item.id.startsWith(uniqueId));
        if (index === -1) {
            return;
        }

        cache.writeQuery({
            ...gqlParams,
            data: dotProp.set(data, `pageBuilder.listPages.data.${index}`, revision)
        });
    });
};

export const removePageFromListCache = (cache: DataProxy, page: PbPageData): void => {
    // Delete the item from list cache
    modifyCacheForAllListPagesQuery(cache, variables => {
        const gqlParams = { query: GQL.LIST_PAGES, variables };
        const data = cache.readQuery(gqlParams);

        const listPagesData = get(data, "pageBuilder.listPages.data") as unknown as PbPageData[];
        if (!listPagesData) {
            return;
        }

        const [uniqueId] = page.id.split("#");
        const index = listPagesData.findIndex(item => item.id.startsWith(uniqueId));
        if (index === -1) {
            return;
        }

        cache.writeQuery({
            ...gqlParams,
            data: dotProp.delete(data, `pageBuilder.listPages.data.${index}`)
        });
    });
};

export const removeRevisionFromEntryCache = (
    cache: DataProxy,
    revision: PbPageRevision
): PbPageRevision[] => {
    const gqlParams = {
        query: GQL.GET_PAGE,
        variables: { id: revision.id }
    };

    const data = cache.readQuery(gqlParams);

    const revisions = get(
        data,
        "pageBuilder.getPage.data.revisions"
    ) as unknown as PbPageRevision[];
    if (!revisions) {
        return [];
    }
    const index = revisions.findIndex(item => item.id === revision.id);
    const newRevisions = dotProp.delete(revisions, index) as PbPageRevision[];

    cache.writeQuery({
        ...gqlParams,
        data: dotProp.set(data, "pageBuilder.getPage.data.revisions", newRevisions)
    });

    // Return new revisions
    return newRevisions;
};
