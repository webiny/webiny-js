import { useCallback, useState } from "react";
import { CmsModel } from "~/types";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { useApolloClient } from "~/admin/hooks";
import {
    CmsEntrySearchQueryResponse,
    CmsEntrySearchQueryVariables,
    SEARCH_CONTENT_ENTRIES
} from "~/admin/plugins/fieldRenderers/ref/components/graphql";

interface ExecuteQueryParams {
    query?: string;
    items: CmsReferenceContentEntry[];
    after?: string;
}

interface Params {
    model: CmsModel;
    limit?: number;
}

export const useEntries = (params: Params) => {
    const client = useApolloClient();
    const { model, limit } = params;

    const [entries, setEntries] = useState<CmsReferenceContentEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
    // const [searchAfter, setSearchAfter] = useState<string | undefined>(undefined);

    const executeQuery = useCallback(
        async (params: ExecuteQueryParams) => {
            const { query, items } = params;
            if (loading) {
                console.log(`Cannot run a new search. Please wait for the previous one to finish.`);
                return;
            }
            setLoading(true);

            try {
                const result = await client.query<
                    CmsEntrySearchQueryResponse,
                    CmsEntrySearchQueryVariables
                >({
                    query: SEARCH_CONTENT_ENTRIES,
                    variables: {
                        query,
                        modelIds: [model.modelId],
                        limit: limit || 10
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
                    setEntries(items.concat(result.data.content.data));
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
        [model.modelId, entries]
    );

    const runSearch = useCallback(
        (query?: string) => {
            if (searchQuery === query) {
                return;
            }
            setSearchQuery(query);
            executeQuery({
                query,
                items: [],
                after: undefined
            });
        },
        [executeQuery]
    );

    // const runLoadMore = useCallback(() => {
    //     executeQuery({
    //         query: searchQuery,
    //         items: entries,
    //         after: searchAfter
    //     });
    // }, [executeQuery, searchQuery]);

    return {
        runSearch,
        // runLoadMore,
        loading,
        entries,
        error
    };
};
