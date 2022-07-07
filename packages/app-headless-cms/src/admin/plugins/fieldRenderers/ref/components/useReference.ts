import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApolloClient } from "~/admin/hooks";
import {
    SEARCH_CONTENT_ENTRIES,
    GET_CONTENT_ENTRY,
    CmsEntryGetQueryResponse,
    CmsEntryGetQueryVariables,
    CmsEntrySearchQueryResponse,
    CmsEntrySearchQueryVariables
} from "./graphql";
import { CmsEditorField, CmsModel } from "~/types";
import { BindComponentRenderProp } from "@webiny/form";
import { OptionItem, OptionItemCollection } from "./types";
import {
    convertReferenceEntriesToOptionCollection,
    convertReferenceEntryToOption
} from "./helpers";
import { parseIdentifier } from "@webiny/utils";

interface UseReferenceHookArgs {
    bind: BindComponentRenderProp;
    field: CmsEditorField;
}

interface UseReferenceHookValue {
    onChange: (value: any, entry: OptionItem) => void;
    setSearch: (value: string) => void;
    value: OptionItem | null;
    loading: boolean;
    options: OptionItem[];
}

type UseReferenceHook = (args: UseReferenceHookArgs) => UseReferenceHookValue;

const getValueHash = (value: any): string | null => {
    if (!value || (!value.id && !value.entryId)) {
        return null;
    } else if (value.entryId) {
        return value.entryId;
    }
    const { id } = parseIdentifier(value.id);
    return id;
};

export const useReference: UseReferenceHook = ({ bind, field }) => {
    const allEntries = useRef<OptionItemCollection>({});
    const client = useApolloClient();
    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [entries, setEntries] = useState<OptionItemCollection>({});
    const [latestEntries, setLatestEntries] = useState<OptionItemCollection>({});
    const [valueEntry, setValueEntry] = useState<OptionItem | null>(null);

    const models = (field.settings ? field.settings.models || [] : []) as Pick<
        CmsModel,
        "modelId" | "name"
    >[];
    const modelsHash = models.map(model => model.modelId).join(",");

    const value = bind.value;
    const valueHash = getValueHash(value);

    const searchEntries = async () => {
        if (!search) {
            return;
        }

        setLoading(true);
        const { data } = await client.query<
            CmsEntrySearchQueryResponse,
            CmsEntrySearchQueryVariables
        >({
            query: SEARCH_CONTENT_ENTRIES,
            variables: {
                modelIds: models.map(m => m.modelId),
                query: search,
                limit: 10
            }
        });
        setLoading(false);

        const collection = convertReferenceEntriesToOptionCollection(data.content.data);
        if (valueEntry) {
            collection[valueEntry.entryId] = valueEntry;
        }
        allEntries.current = {
            ...allEntries.current,
            ...collection
        };

        setEntries(collection);
    };

    useEffect(() => {
        searchEntries();
    }, [search]);

    useEffect(() => {
        if (models.length === 0) {
            return;
        }
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
                const latestEntryData = convertReferenceEntriesToOptionCollection(
                    data.content.data
                );
                if (valueEntry) {
                    latestEntryData[valueEntry.entryId] = valueEntry;
                }

                setLatestEntries(latestEntryData);
                allEntries.current = {
                    ...allEntries.current,
                    ...latestEntryData
                };
            });
    }, [modelsHash]);

    useEffect(() => {
        if (!value || !models) {
            setValueEntry(() => null);
            return;
        }

        const entry = valueHash ? allEntries.current[valueHash] : null;
        if (entry) {
            /**
             * if entry exists set valueEntry to that one so we do not load new one
             */
            setValueEntry(() => {
                return entry;
            });
            return;
        }

        setLoading(true);
        /**
         * Query loads both latest and published entries.
         * We do this in a single query because there might not be a published entry so we can use the latest one.
         */
        client
            .query<CmsEntryGetQueryResponse, CmsEntryGetQueryVariables>({
                query: GET_CONTENT_ENTRY,
                variables: {
                    entry: {
                        modelId: value.modelId,
                        id: value.id
                    }
                }
            })
            .then(res => {
                setLoading(false);
                const dataEntry = res.data.latest.data;
                if (!dataEntry) {
                    return;
                }
                const option: OptionItem = {
                    ...convertReferenceEntryToOption(dataEntry),
                    latest: dataEntry.id,
                    published: res.data.published.data ? res.data.published.data.id : null
                };
                allEntries.current[option.entryId] = option;
                setLatestEntries(prev => {
                    return {
                        ...prev,
                        [option.entryId]: {
                            ...option
                        }
                    };
                });
                /**
                 * Calculate a couple of props for the Autocomplete component.
                 */
                setValueEntry(() => {
                    return option;
                });
            });
    }, [valueHash, modelsHash]);

    const onChange = useCallback((value: string, entry: OptionItem) => {
        if (value !== null) {
            setSearch("");

            setValueEntry(() => {
                return entry;
            });
            bind.onChange({
                modelId: entry.modelId,
                id: entry.id
            });
            return;
        }

        setValueEntry(() => null);
        bind.onChange(null);
    }, []);

    /**
     * Format options for the Autocomplete component.
     */
    const options = useMemo(() => Object.values(entries), [valueHash, entries]);

    /**
     * Format default options for the Autocomplete component.
     */
    const defaultOptions = useMemo(() => {
        return Object.values(latestEntries);
    }, [valueHash, latestEntries]);

    const outputOptions: OptionItem[] = (search && options ? options : defaultOptions) || [];

    if (valueEntry && outputOptions.some(opt => opt.entryId === valueEntry.entryId) === false) {
        outputOptions.push(valueEntry);
    }

    return {
        onChange,
        setSearch,
        value: valueEntry,
        loading,
        options: outputOptions
    };
};
