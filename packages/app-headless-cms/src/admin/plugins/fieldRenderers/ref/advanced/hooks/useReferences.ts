import { useCallback, useEffect, useMemo, useState } from "react";
import { useApolloClient } from "~/admin/hooks";
import {
    CmsReferenceContentEntry,
    CmsReferenceValue
} from "~/admin/plugins/fieldRenderers/ref/components/types";
import {
    LIST_LATEST_CONTENT_ENTRIES,
    ListLatestCmsEntriesResponse,
    ListLatestCmsEntriesVariables
} from "~/admin/plugins/fieldRenderers/ref/advanced/hooks/graphql";
import ApolloClient from "apollo-client";

interface ExecuteSearchParams {
    setLoading: (loading: boolean) => void;
    setError: (error: string | undefined | null) => void;
    setEntries: (entries: CmsReferenceContentEntry[]) => void;
    client: ApolloClient<any>;
    values: CmsReferenceValue[];
}

const executeSearch = async (params: ExecuteSearchParams): Promise<void> => {
    const { setLoading, setError, setEntries, client, values } = params;
    setLoading(true);
    try {
        const result = await client.query<
            ListLatestCmsEntriesResponse,
            ListLatestCmsEntriesVariables
        >({
            query: LIST_LATEST_CONTENT_ENTRIES,
            variables: {
                entries: values.map(value => {
                    return {
                        id: value.id,
                        modelId: value.modelId
                    };
                })
            }
        });
        const error = result.data.entries?.error;
        if (error) {
            setError(error.message);
            setEntries([]);
        }
        setError(null);
        setEntries(result.data.entries.data);
    } catch (ex) {
        setError(ex.message);
        setEntries([]);
    } finally {
        setLoading(false);
    }
};

interface UseReferencesParams {
    values?: CmsReferenceValue[] | CmsReferenceValue | null;
}

export const useReferences = ({ values: initialValues }: UseReferencesParams) => {
    const client = useApolloClient();
    const [entries, setEntries] = useState<CmsReferenceContentEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined | null>(null);

    const [hash, setHash] = useState<string | null>(null);

    const values = useMemo(() => {
        return Array.isArray(initialValues) ? initialValues : initialValues ? [initialValues] : [];
    }, [initialValues]);

    useEffect(() => {
        const value = values
            .map(item => {
                return item.id;
            })
            .sort()
            .join("-");
        if (value.length === 0) {
            setEntries([]);
            setHash(null);
            return;
        }
        /**
         * If there is no crypto.subtle, lets skip this - but at this point the hash will be enormous.
         */
        if (!window.crypto?.subtle) {
            setHash(value);
            return;
        }

        window.crypto.subtle.digest("SHA-1", new TextEncoder().encode(value)).then(encoded => {
            const decoded = new TextDecoder().decode(encoded);
            if (hash === decoded) {
                return;
            }
            setHash(decoded);
        });
    }, [values]);

    useEffect(() => {
        if (!hash || values.length === 0) {
            setEntries([]);
            return;
        }
        executeSearch({
            client,
            values,
            setLoading,
            setError,
            setEntries
        });
    }, [hash]);

    const loadMore = useCallback(() => {
        return null;
    }, []);

    return {
        loading,
        entries: values
            .map(({ id }) => {
                return entries.find(entry => entry.id === id);
            })
            .filter(Boolean) as CmsReferenceContentEntry[],
        error,
        loadMore
    };
};
