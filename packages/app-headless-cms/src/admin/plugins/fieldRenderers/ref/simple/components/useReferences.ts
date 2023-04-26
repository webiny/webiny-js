import ApolloClient from "apollo-client";
import { useEffect, useState } from "react";
import { useApolloClient } from "~/admin/hooks";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";
import {
    CmsEntrySearchQueryResponse,
    CmsEntrySearchQueryVariables,
    SEARCH_CONTENT_ENTRIES
} from "~/admin/plugins/fieldRenderers/ref/components/graphql";
import { CmsModel } from "~/types";

interface ExecuteSearchParams {
    setLoading: (loading: boolean) => void;
    setError: (error: string | undefined | null) => void;
    setEntries: (entries: CmsReferenceContentEntry[]) => void;
    client: ApolloClient<any>;
    models: CmsModel[];
}

const executeSearch = async (params: ExecuteSearchParams): Promise<void> => {
    const { setLoading, setError, setEntries, client, models } = params;
    setLoading(true);
    try {
        const result = await client.query<
            CmsEntrySearchQueryResponse,
            CmsEntrySearchQueryVariables
        >({
            query: SEARCH_CONTENT_ENTRIES,
            variables: {
                modelIds: models.map(model => model.modelId),
                limit: 10000
            }
        });
        const error = result.data.content?.error;
        if (error) {
            setError(error.message);
            return;
        }

        setError(null);
        setEntries(result.data.content.data);
    } catch (ex) {
        setError(ex.message);
    } finally {
        setLoading(false);
    }
};

interface UseReferencesParams {
    models?: CmsModel[];
}

export const useReferences = ({ models }: UseReferencesParams) => {
    const client = useApolloClient();
    const [entries, setEntries] = useState<CmsReferenceContentEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined | null>(null);

    useEffect(() => {
        if (!models || models.length === 0) {
            return;
        }
        executeSearch({
            client,
            models,
            setLoading,
            setError,
            setEntries
        });
    }, [models]);

    return {
        loading,
        entries,
        error
    };
};
