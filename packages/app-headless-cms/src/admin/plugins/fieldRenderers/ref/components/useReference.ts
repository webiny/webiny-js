import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApolloClient } from "~/admin/hooks";
import * as GQL from "./graphql";
import { getOptions, OptionItem } from "./getOptions";
import { CmsEditorField, CmsModel } from "~/types";
import { CmsEntrySearchQueryResponse, CmsEntrySearchQueryVariables } from "./graphql";
import { BindComponentRenderProp } from "@webiny/form";

interface DataEntry {
    id: string;
    model: {
        modelId: string;
        name: string;
    };
    status: "published" | "draft";
    title: string;
}

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

type EntryCollection = Record<string, DataEntry>;

const convertQueryDataToEntryList = (data: DataEntry[]): EntryCollection => {
    return data.reduce((collection, entry) => {
        collection[entry.id] = entry;
        return collection;
    }, {} as EntryCollection);
};

const convertValueEntryToData = (entry: OptionItem): DataEntry => {
    return {
        id: entry.id,
        model: {
            modelId: entry.modelId,
            name: entry.modelName
        },
        status: entry.published ? "published" : "draft",
        title: entry.name
    };
};

const convertDataEntryToValue = (entry: DataEntry): OptionItem => {
    return {
        id: entry.id,
        modelId: entry.model.modelId,
        modelName: entry.model.name,
        published: entry.status === "published",
        name: entry.title
    };
};

const assignValueEntry = (entry: OptionItem | null, collection: EntryCollection): void => {
    if (!entry) {
        return;
    }
    collection[entry.id] = convertValueEntryToData(entry);
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
        const { data } = await client.query({
            query: GQL.SEARCH_CONTENT_ENTRIES,
            variables: { modelIds: models.map(m => m.modelId), query: search }
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
                query: GQL.SEARCH_CONTENT_ENTRIES,
                variables: {
                    modelIds: models.map(m => m.modelId),
                    query: "__latest__",
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
                return convertDataEntryToValue(entry);
            });
            return;
        }

        setLoading(true);
        client
            .query({
                query: GQL.GET_CONTENT_ENTRY,
                variables: { entry: { modelId: value.modelId, id: value.id } }
            })
            .then(res => {
                setLoading(false);
                const dataEntry: DataEntry | null = res.data.content.data;
                if (!dataEntry) {
                    return;
                }
                allEntries.current[dataEntry.id] = dataEntry;
                setLatestEntries(prev => {
                    return {
                        ...prev,
                        [dataEntry.id]: dataEntry
                    };
                });
                // Calculate a couple of props for the Autocomplete component.
                setValueEntry(() => {
                    return convertDataEntryToValue(dataEntry);
                });
            });
    }, [valueHash, modelsHash]);

    const onChange = useCallback((value: string, entry: OptionItem) => {
        if (value !== null) {
            setSearch("");

            setValueEntry(() => {
                return entry;
            });
            bind.onChange({ modelId: entry.modelId, id: entry.id });
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

    if (valueEntry && outputOptions.some(opt => opt.id === valueEntry.id) === false) {
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
