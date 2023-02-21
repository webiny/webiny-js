import { useEffect, useState } from "react";
import { useApolloClient, useQuery } from "~/admin/hooks";
import {
    CmsReferenceContentEntry,
    CmsReferenceValue
} from "~/admin/plugins/fieldRenderers/ref/components/types";
import {
    GET_SELECTED_CONTENT_ENTRY,
    CmsGetSelectedEntryVariables,
    CmsGetSelectedEntryResponse
} from "./graphql";

interface Params {
    value?: CmsReferenceValue | null;
}
export const useReference = ({ value }: Params) => {
    const [entry, setEntry] = useState<CmsReferenceContentEntry | null>(null);
    const client = useApolloClient();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined | null>(null);

    const { id = "", modelId = "" } = value || {};

    console.log(`id: ${id}`);
    useEffect(() => {
        if (!id || !modelId) {
            setEntry(null);
            return;
        }
        (async () => {
            setLoading(true);
            try {
                const result = await client.query<
                    CmsGetSelectedEntryResponse,
                    CmsGetSelectedEntryVariables
                >({
                    query: GET_SELECTED_CONTENT_ENTRY,
                    variables: {
                        entry: {
                            modelId,
                            id
                        }
                    }
                });
                if (result.data?.entry.error) {
                    setError(result.data.entry.error.message);
                    setEntry(null);
                }
                setError(null);
                setEntry(result.data?.entry.data || null);
            } catch (ex) {
                setError(ex.message);
                setEntry(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    return {
        loading,
        entry,
        error
    };
};
