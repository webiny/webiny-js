import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import get from "lodash/get";
import { useApolloClient } from "~/admin/hooks";
import { createListQuery, createGetQuery, GET_CONTENT_MODELS } from "./graphql";
import { getOptions } from "./getOptions";
import { CmsEditorContentModel, CmsEditorField } from "~/types";

interface ValueEntry {
    id: string;
    modelId: string;
    published: boolean;
    name: string;
}
interface DataEntry {
    id: string;
    meta: {
        modelId: string;
        status: "published" | "draft";
        title: string;
    };
}
interface UseReferenceHookArgs {
    bind: any;
    field: CmsEditorField;
}
interface UseReferenceHookValue {
    onChange: (value: any) => void;
    setSearch: (value: string) => void;
    value: ValueEntry | null;
    loading: boolean;
    options: ValueEntry[];
}
type UseReferenceHook = (args: UseReferenceHookArgs) => UseReferenceHookValue;

type EntryCollection = Record<string, DataEntry>;

const convertQueryDataToEntryList = (data: DataEntry[]): EntryCollection => {
    return data.reduce((collection, entry) => {
        collection[`${entry.meta.modelId}:${entry.id}`] = entry;
        return collection;
    }, {});
};

const convertValueEntryToData = (entry: ValueEntry): DataEntry => {
    return {
        id: entry.id,
        meta: {
            modelId: entry.modelId,
            status: entry.published ? "published" : "draft",
            title: entry.name
        }
    };
};

const convertDataEntryToValue = (entry: DataEntry): ValueEntry => {
    return {
        id: entry.id,
        modelId: entry.meta.modelId,
        published: entry.meta.status === "published",
        name: entry.meta.title
    };
};

const assignValueEntry = (entry: ValueEntry | null, collection: EntryCollection): void => {
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
    const [models, setModels] = useState<CmsEditorContentModel[]>(null);
    const [LIST_CONTENT, setListContent] = useState<any>(null);
    const [GET_CONTENT, setGetContent] = useState<any>(null);
    const [entries, setEntries] = useState<EntryCollection>({});
    const [latestEntries, setLatestEntries] = useState<EntryCollection>({});
    const [valueEntry, setValueEntry] = useState<ValueEntry>(null);

    const { modelId } = field.settings.models[0];
    const value = bind.value ? bind.value.entryId : null;

    const searchEntries = async () => {
        if (!search) {
            return;
        }

        if (!LIST_CONTENT || !search) {
            return;
        }

        setLoading(true);
        const { data } = await client.query({
            query: LIST_CONTENT,
            variables: { where: { [`${titleFieldId}_contains`]: search } }
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

    const prepareData = async () => {
        // Fetch ref content model data, to get its title field.
        setLoading(true);
        const refContentModelQuery = await client.query({
            query: GET_CONTENT_MODELS
        });

        const contentModels = get(refContentModelQuery, `data.listContentModels.data`, []);
        setModels(contentModels);

        // Once we have contentModels loaded, this will construct proper list query.
        setListContent(createListQuery(contentModels));
        setLoading(false);
    };

    useEffect(() => {
        prepareData();
    }, [modelId]);

    useEffect(() => {
        if (!LIST_CONTENT) {
            return;
        }

        client
            .query({
                query: LIST_CONTENT,
                variables: { limit: 10 }
            })
            .then(({ data }) => {
                const latestEntryData = convertQueryDataToEntryList(data.content.data);
                assignValueEntry(valueEntry, latestEntryData);

                setLatestEntries(latestEntryData);
                Object.assign(allEntries.current, latestEntryData);
            });
    }, [modelId, LIST_CONTENT]);

    useEffect(() => {
        if (!value || !models) {
            setValueEntry(() => null);
            return;
        }

        const entry = allEntries.current[value];
        if (entry) {
            // if entry exists set valueEntry to that one so we do not load new one
            setValueEntry(() => {
                return convertDataEntryToValue(entry);
            });
            return;
        }

        setLoading(true);
        const GET_CONTENT = createGetQuery(models.find(model => model.modelId === value.modelId));
        client.query({ query: GET_CONTENT, variables: { revision: value } }).then(res => {
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
    }, [value, GET_CONTENT, models]);

    const onChange = useCallback(value => {
        if (value !== null) {
            const entry = allEntries.current[value];
            setSearch("");
            setValueEntry(() => {
                return convertDataEntryToValue(entry);
            });
            const [modelId, entryId] = value.split(":");
            return bind.onChange({ modelId, entryId });
        }

        setValueEntry(() => null);
        bind.onChange(null);
    }, []);

    // Format options for the Autocomplete component.
    const options = useMemo(() => getOptions(Object.values(entries)), [entries]);

    // Format default options for the Autocomplete component.
    const defaultOptions = useMemo(() => getOptions(Object.values(latestEntries)), [latestEntries]);

    const outputOptions: ValueEntry[] = search ? options : defaultOptions || [];

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
