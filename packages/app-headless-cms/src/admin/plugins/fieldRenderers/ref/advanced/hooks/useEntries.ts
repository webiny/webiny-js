import { useCallback, useState } from "react";
import { CmsModel } from "~/types";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { useApolloClient } from "~/admin/hooks";
import {
    CmsEntrySearchQueryResponse,
    CmsEntrySearchQueryVariables,
    SEARCH_CONTENT_ENTRIES
} from "~/admin/plugins/fieldRenderers/ref/components/graphql";

interface Params {
    model: CmsModel;
}
export const useEntries = (params: Params) => {
    const client = useApolloClient();
    const { model } = params;

    const [entries, setEntries] = useState<CmsReferenceContentEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const runSearch = useCallback(
        async (query?: string) => {
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
                        modelIds: [model.modelId],
                        limit: 10,
                        query
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
                    setEntries(result.data.content.data);
                    setError(null);
                }
            } catch (ex) {
                setEntries([]);
                console.log(`Error while feching entries for model ${model.modelId}.`);
                console.log(JSON.stringify(ex));
                setError(ex.message);
            } finally {
                setLoading(false);
            }
        },
        [model]
    );

    return {
        runSearch,
        loading,
        entries,
        error
    };
};
