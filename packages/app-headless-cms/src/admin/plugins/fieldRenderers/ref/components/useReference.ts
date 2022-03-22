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
import { getOptions } from "./getOptions";
import { CmsEditorField, CmsModel } from "~/types";
import { BindComponentRenderProp } from "@webiny/form";
import { OptionItem, ReferenceDataEntry } from "./types";

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

type EntryCollection = Record<string, ReferenceDataEntry>;

const convertQueryDataToEntryList = (data: ReferenceDataEntry[]): EntryCollection => {
    return data.reduce((collection, entry) => {
        collection[entry.entryId] = entry;
        return collection;
    }, {} as EntryCollection);
};

const convertOptionToData = (entry: OptionItem): ReferenceDataEntry => {
    return {
        id: entry.id,
        entryId: entry.entryId,
        model: {
            modelId: entry.modelId,
            name: entry.modelName
        },
        status: entry.published ? "published" : "draft",
        title: entry.name
    };
};

const convertDataEntryToOption = (entry: ReferenceDataEntry): OptionItem => {
    return {
        id: entry.id,
        entryId: entry.entryId,
        modelId: entry.model.modelId,
        modelName: entry.model.name,
        published: entry.status === "published",
        status: entry.status,
        name: entry.title
    };
};

const assignValueEntry = (entry: OptionItem | null, collection: EntryCollection): void => {
    if (!entry) {
        return;
    }
    collection[entry.id] = convertOptionToData(entry);
};

export const useReference: UseReferenceHook = ({ bind, field }) => {
    const allEntries = useRef<EntryCollection>({});
    const client = useApolloClient();
    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [entries, setEntries] = useState<EntryCollection>({});
    const [latestEntries, setLatestEntries] = useState<EntryCollection>({});
    const [valueEntry, setValueEntry] = useState<OptionItem | null>(null);

    const models = (field.settings ? field.settings.models || [] : []) as Pick<
        CmsModel,
        "modelId" | "name"
    >[];
    const modelsHash = models.join(",");

    const value = bind.value;
    const valueHash = value ? value.id : null;

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
                query: search
            }
        });

        setLoading(false);

        const searchEntries = convertQueryDataToEntryList(data.content.data);
        assignValueEntry(valueEntry, searchEntries);
        Object.assign(allEntries.current, searchEntries);

        setEntries(searchEntries);
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
                const latestEntryData = convertQueryDataToEntryList(data.content.data);
                assignValueEntry(valueEntry, latestEntryData);

                setLatestEntries(latestEntryData);
                Object.assign(allEntries.current, latestEntryData);
            });
    }, [modelsHash]);

    useEffect(() => {
        if (!value || !models) {
            setValueEntry(() => null);
            return;
        }

        const entry = allEntries.current[valueHash];
        if (entry) {
            // if entry exists set valueEntry to that one so we do not load new one
            setValueEntry(() => {
                return convertDataEntryToOption(entry);
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
                const dataEntry = res.data.published.data || res.data.latest.data;
                if (!dataEntry) {
                    return;
                }
                const entry: ReferenceDataEntry = {
                    ...dataEntry,
                    latest: res.data.latest.data ? res.data.latest.data.id : null,
                    published: res.data.published.data ? res.data.published.data.id : null
                };
                allEntries.current[dataEntry.entryId] = entry;
                setLatestEntries(prev => {
                    return {
                        ...prev,
                        [dataEntry.entryId]: {
                            ...entry
                        }
                    };
                });
                // Calculate a couple of props for the Autocomplete component.
                setValueEntry(() => {
                    return convertDataEntryToOption(dataEntry);
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
                entryId: entry.entryId,
                id: entry.id
            });
            return;
        }

        setValueEntry(() => null);
        bind.onChange(null);
    }, []);

    // Format options for the Autocomplete component.
    const options = useMemo(() => getOptions(Object.values(entries)), [entries]);

    // Format default options for the Autocomplete component.
    const defaultOptions = useMemo(() => {
        return getOptions(Object.values(latestEntries));
    }, [latestEntries]);

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
