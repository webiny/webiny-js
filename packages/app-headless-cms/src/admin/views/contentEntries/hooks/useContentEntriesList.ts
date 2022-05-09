import { useCallback, useEffect, useMemo, useState } from "react";
import get from "lodash/get";
import set from "lodash/set";
import unset from "lodash/unset";
import cloneDeep from "lodash/cloneDeep";
import debounce from "lodash/debounce";
import { useRouter } from "@webiny/react-router";
import {
    createListQuery,
    CmsEntriesListQueryVariables,
    CmsEntriesListQueryResponse
} from "~/admin/graphql/contentEntries";
import { useQuery } from "~/admin/hooks";
import { useContentEntries } from "./useContentEntries";
import { CmsEditorContentEntry, CmsMetaResponse } from "~/types";

interface UpdateSearchCallableParams {
    filter: string;
    query: URLSearchParams;
}
interface UpdateSearchCallable {
    (params: UpdateSearchCallableParams): void;
}

export function useContentEntriesList() {
    const { contentModel, listQueryVariables, setListQueryVariables, sorters, canCreate } =
        useContentEntries();

    const [loadMoreLoading, setLoadMoreLoading] = useState<boolean>(false);
    const [filter, setFilter] = useState<string>("");

    const { history } = useRouter();
    const baseUrl = `/cms/content-entries/${contentModel.modelId}`;

    // Get entry ID and search query (if any)
    const query = new URLSearchParams(location.search);
    const id = query.get("id");
    const searchQuery = query.get("search");
    const updateSearch = useCallback(
        debounce<UpdateSearchCallable>(({ filter, query }) => {
            const search = query.get("search");
            if (typeof search !== "string" && !filter) {
                return;
            }

            // We use the title field with the "contains" operator for doing basic searches.
            const searchField = contentModel.titleFieldId + "_contains";
            setListQueryVariables(prev => {
                const next = cloneDeep(prev);
                if (filter) {
                    set(next, `where.${searchField}`, filter);
                } else {
                    unset(next, `where.${searchField}`);
                }

                return next;
            });

            if (search !== filter) {
                query.set("search", filter);
                history.push(`${baseUrl}?${query.toString()}`);
            }
        }, 250),
        [baseUrl]
    );

    // Set "filter" from search "query" on page load.
    useEffect(() => {
        if (searchQuery) {
            setFilter(searchQuery);
        }
    }, [baseUrl, searchQuery]);

    // When filter changes, run GQL query
    useEffect(() => updateSearch({ filter, query }), [baseUrl, filter]);

    // Generate a query based on current content model
    const LIST_QUERY = useMemo(() => createListQuery(contentModel), [contentModel.modelId]);
    const { data, loading, fetchMore } = useQuery<
        CmsEntriesListQueryResponse,
        CmsEntriesListQueryVariables
    >(LIST_QUERY, { variables: listQueryVariables, fetchPolicy: "network-only" });

    const onCreate = useCallback(() => {
        history.push(`/cms/content-entries/${contentModel.modelId}?new=true`);
    }, [contentModel]);

    const filterByStatus = useCallback((entries: CmsEditorContentEntry[], status?: string) => {
        if (!status || status === "all") {
            return entries;
        }
        return entries.filter(item => item.meta.status === status);
    }, []);

    // Load more entries on scroll
    const loadMore = useCallback((): void => {
        const meta: CmsMetaResponse = get(data, "content.meta", {});
        if (meta.hasMoreItems) {
            setLoadMoreLoading(true);
            fetchMore({
                variables: {
                    after: meta.cursor
                },
                updateQuery: (prev: CmsEntriesListQueryResponse, result) => {
                    if (!result || !result.fetchMoreResult) {
                        return prev;
                    }
                    const fetchMoreResult = result.fetchMoreResult;

                    const next = { ...fetchMoreResult };

                    next.content.data = [...prev.content.data, ...fetchMoreResult.content.data];
                    setLoadMoreLoading(false);
                    return next;
                }
            });
        }
    }, [data]);

    const editEntry = useCallback(
        (entry: CmsEditorContentEntry) => () => {
            history.push(
                `/cms/content-entries/${contentModel.modelId}?id=${encodeURIComponent(entry.id)}`
            );
        },
        [contentModel.modelId]
    );

    return {
        contentModel,
        listQueryVariables,
        setListQueryVariables,
        sorters,
        id,
        loading,
        data: filterByStatus(get(data, "content.data", []), listQueryVariables.status),
        loadMore,
        loadMoreLoading,
        canCreate,
        onCreate,
        filter,
        setFilter,
        editEntry
    };
}
