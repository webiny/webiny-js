import { useEffect, useState } from "react";
import { useQuery } from "~/admin/hooks";
import { CmsReferenceContentEntry } from "~/admin/plugins/fieldRenderers/ref/components/types";
import {
    GET_SELECTED_CONTENT_ENTRY,
    CmsGetSelectedEntryVariables,
    CmsGetSelectedEntryResponse
} from "./graphql";

interface Params {
    value?: {
        id: string;
        entryId: string;
        modelId: string;
    };
}
export const useReference = ({ value }: Params) => {
    const [entry, setEntry] = useState<CmsReferenceContentEntry | null>(null);
    const [error, setError] = useState<string | undefined | null>(null);

    const { id = "", modelId = "" } = value || {};

    const result = useQuery<CmsGetSelectedEntryResponse, CmsGetSelectedEntryVariables>(
        GET_SELECTED_CONTENT_ENTRY,
        {
            skip: !id || !modelId,
            variables: {
                entry: {
                    modelId,
                    id
                }
            }
        }
    );
    console.log(result);

    useEffect(() => {
        if (result.loading) {
            return;
        } else if (result.error) {
            setError(result.error.message);
            setEntry(null);
        } else if (result.data?.entry.error) {
            setError(result.data.entry.error.message);
            setEntry(null);
        }
        setError(null);
        setEntry(result.data?.entry.data || null);
    }, [result.data, result.loading, result.error]);

    return {
        loading: result.loading,
        entry,
        error
    };
};
