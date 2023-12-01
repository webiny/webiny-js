import { useCallback, useMemo, useState } from "react";
import { CmsModel, CmsModelField } from "~/types";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { useApolloClient } from "~/admin/hooks";
import {
    createSearchQuery,
    SearchQueryResponse,
    SearchQueryVariables
} from "~/admin/plugins/fieldRenderers/ref/advanced/hooks/graphql";

const searchableFieldTypes = ["text", "long-text"];
const isFieldSearchable = (field: CmsModelField): boolean => {
    return searchableFieldTypes.includes(field.type);
};

interface ExecuteQueryParams {
    items: CmsReferenceContentEntry[];
    query?: string;
    after?: string;
}

interface Params {
    model: CmsModel;
    limit: number;
}

export const useEntries = (params: Params) => {
    const client = useApolloClient();
    const { model, limit } = params;

    const [entries, setEntries] = useState<CmsReferenceContentEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
    const [cursor, setCursor] = useState<string | undefined>();

    const SEARCH_QUERY = useMemo(() => {
        return createSearchQuery(model);
    }, [model.modelId]);

    const createWhere = useCallback(
        (query?: string) => {
            if (!query) {
                return {};
            }
            const conditions = model.fields
                .map(field => {
                    if (!isFieldSearchable(field)) {
                        return null;
                    }
                    return {
                        [`${field.fieldId}_contains`]: query
                    };
                })
                .filter(Boolean);
            if (conditions.length === 0) {
                return {};
            }
            return {
                OR: conditions
            };
        },
        [model.modelId]
    );

    const executeQuery = useCallback(
        async (params: ExecuteQueryParams) => {
            const { query, items, after } = params;
            if (loading) {
                console.log(`Cannot run a new search. Please wait for the previous one to finish.`);
                return;
            }
            setLoading(true);

            const where = createWhere(query);

            try {
                const result = await client.query<SearchQueryResponse, SearchQueryVariables>({
                    query: SEARCH_QUERY,
                    variables: {
                        where,
                        sort: ["savedOn_DESC"],
                        limit,
                        after
                    }
                });

                if (result.data.content.error) {
                    setEntries([]);
                    setError(result.data.content.error.message);
                    return;
                } else if (!result.data.content.data) {
                    setEntries([]);
                    setError(
                        `Unknown error while fetching entries for model ${model.modelId}. Please check your network requests tab.`
                    );
                    return;
                } else {
                    const newItems = result.data.content.data.map(entry => {
                        return {
                            id: entry.id,
                            entryId: entry.entryId,
                            title: entry.meta.title,
                            description: entry.meta.description,
                            image: entry.meta.image,
                            status: entry.meta.status,
                            model: {
                                modelId: model.modelId,
                                name: model.name
                            },
                            createdBy: entry.createdBy,
                            modifiedBy: entry.modifiedBy,
                            createdOn: entry.createdOn,
                            savedOn: entry.savedOn,
                            location: {
                                folderId: entry.wbyAco_location?.folderId
                            }
                        };
                    });
                    setEntries(items.concat(newItems));
                    setCursor(result.data.content.meta.cursor || undefined);
                    setError(null);
                }
            } catch (ex) {
                setEntries([]);
                console.log(`Error while fetching entries for model ${model.modelId}.`);
                console.log(JSON.stringify(ex));
                setError(ex.message);
            } finally {
                setLoading(false);
            }
        },
        [model.modelId, entries, loading, error]
    );

    const runSearch = useCallback(
        (query?: string) => {
            if (searchQuery === query) {
                console.log(`Skipping search as it is the same as the previous one.`);
                return;
            }
            setSearchQuery(query);
            executeQuery({
                query,
                items: []
            });
        },
        [executeQuery, searchQuery]
    );

    const loadMore = useCallback(() => {
        if (loading) {
            console.log(`Please wait until the loading finishes to start a new one.`);
            return;
        } else if (!cursor) {
            console.log(
                `Trying to load more results but there is no cursor defined. Probably there are no more results.`
            );
            return;
        }
        executeQuery({
            query: searchQuery,
            items: entries,
            after: cursor
        });
    }, [searchQuery, loading, cursor, entries]);

    return {
        runSearch,
        loadMore,
        loading,
        entries,
        error,
        hasMore: !!cursor
    };
};
