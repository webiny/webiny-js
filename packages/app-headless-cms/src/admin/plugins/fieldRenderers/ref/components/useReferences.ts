import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApolloClient } from "~/admin/hooks";
import { getOptions } from "./getOptions";
import { CmsEditorField, CmsLatestContentEntry, CmsModel } from "~/types";
import {
    SEARCH_CONTENT_ENTRIES,
    GET_CONTENT_ENTRIES,
    CmsEntrySearchQueryResponse,
    CmsEntrySearchQueryVariables,
    CmsEntryGetListResponse,
    CmsEntryGetListVariables,
    CmsEntryGetEntryVariable
} from "./graphql";
import { BindComponentRenderProp } from "@webiny/form";

export interface ReferencedCmsEntry {
    id: string;
    modelId: string;
    modelName: string;
    published: boolean;
    name: string;
}

function distinctBy(
    key: keyof CmsLatestContentEntry,
    array: CmsLatestContentEntry[]
): CmsLatestContentEntry[] {
    const keys = array.map(value => value[key]);
    return array.filter((value, index) => keys.indexOf(value[key]) === index);
}

interface UseReferencesParams {
    bind: BindComponentRenderProp;
    field: CmsEditorField;
}
export const useReferences = ({ bind, field }: UseReferencesParams) => {
    const allEntries = useRef<CmsLatestContentEntry[]>([]);
    const client = useApolloClient();
    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [entries, setEntries] = useState<CmsLatestContentEntry[]>([]);
    const [latestEntries, setLatestEntries] = useState<CmsLatestContentEntry[]>([]);
    const [valueEntries, setValueEntries] = useState<ReferencedCmsEntry[]>([]);

    const models = (field.settings ? field.settings.models || [] : []) as Pick<
        CmsModel,
        "modelId"
    >[];
    const modelsHash = models.join(",");
    const values: CmsEntryGetEntryVariable[] = bind.value ? bind.value : [];

    const searchEntries = async (): Promise<void> => {
        if (!search) {
            return;
        }

        setLoading(true);
        const { data } = await client.query<
            CmsEntrySearchQueryResponse,
            CmsEntrySearchQueryVariables
        >({
            query: SEARCH_CONTENT_ENTRIES,
            variables: { modelIds: models.map(m => m.modelId), query: search }
        });
        setLoading(false);

        allEntries.current = distinctBy("id", [...allEntries.current, ...data.content.data]);
        setEntries(data.content.data);
    };

    useEffect(() => {
        searchEntries();
    }, [search]);

    useEffect(() => {
        client
            .query<CmsEntrySearchQueryResponse, CmsEntrySearchQueryVariables>({
                query: SEARCH_CONTENT_ENTRIES,
                variables: {
                    modelIds: models.map(m => m.modelId),
                    limit: 10
                },
                /**
                 * We cannot update this query response in cache after a reference entry being created/deleted,
                 * which result in cached response being stale, therefore, we're setting the fetchPolicy to "network-only" to by passing cache.
                 */
                fetchPolicy: "network-only"
            })
            .then(({ data }) => {
                setLatestEntries(data.content.data);
                allEntries.current = [...data.content.data];
            });
    }, [modelsHash]);

    useEffect(() => {
        if (!values || !values.length) {
            return;
        }

        setLoading(true);

        client
            .query<CmsEntryGetListResponse, CmsEntryGetListVariables>({
                query: GET_CONTENT_ENTRIES,
                variables: {
                    entries: values
                }
            })
            .then(res => {
                setLoading(false);
                const entries = res.data.content.data;

                // Calculate a couple of props for the Autocomplete component.
                setValueEntries(
                    entries.map(entry => ({
                        id: entry.id,
                        modelId: entry.model.modelId,
                        modelName: entry.model.name,
                        published: entry.status === "published",
                        name: entry.title
                    }))
                );
            });
    }, []);

    /**
     * onChange callback will update internal component state using the previously loaded entries by IDs.
     * It will also format the value to store to the DB.
     */
    const onChange = useCallback((values: ReferencedCmsEntry[]): void => {
        setSearch("");
        setValueEntries(values);

        // Update parent form
        bind.onChange(values.map(item => ({ modelId: item.modelId, id: item.id })));
    }, []);

    // Format options for the Autocomplete component.
    const options = useMemo(() => getOptions(entries), [entries]);

    // Format default options for the Autocomplete component.
    const defaultOptions = useMemo(() => getOptions(latestEntries), [latestEntries]);

    return {
        onChange,
        loading,
        setSearch,
        // Selected entries
        entries: valueEntries,
        // Options to show when the autocomplete dropdown is visible
        options: search ? options : defaultOptions || []
    };
};
