import { useEffect, useMemo, useState } from "react";
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

    const values = useMemo(() => {
        if (!initialValues) {
            return [];
        } else if (Array.isArray(initialValues)) {
            return initialValues;
        } else if (!initialValues?.id) {
            return [];
        }
        return [initialValues];
    }, [initialValues]);

    useEffect(() => {
        if (values.length === 0) {
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
    }, [values, setEntries, setLoading, setError, client]);

    return {
        loading,
        entries,
        error
    };
};
