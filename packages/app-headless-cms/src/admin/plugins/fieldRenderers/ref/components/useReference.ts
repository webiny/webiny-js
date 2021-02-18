import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import get from "lodash/get";
import { useApolloClient } from "@webiny/app-headless-cms/admin/hooks";
import { createListQuery, createGetQuery, GET_CONTENT_MODEL } from "./graphql";
import { getOptions } from "./getOptions";
import { CmsEditorContentModel, CmsEditorField } from "@webiny/app-headless-cms/types";

interface ValueEntry {
    id: string;
    published: boolean;
    name: string;
}
interface UseReferenceHookArgs {
    bind: any;
    field: CmsEditorField;
    assignValueEntry?: boolean;
}
interface UseReferenceHookValue {
    onChange: (value: any) => void;
    setSearch: (value: string) => void;
    value: ValueEntry | null;
    loading: boolean;
    options: ValueEntry[];
}
type UseReferenceHook = (args: UseReferenceHookArgs) => UseReferenceHookValue;

function distinctBy(key: string, array: any[]): any[] {
    const keys = array.map(value => value[key]);
    return array.filter((value, index) => keys.indexOf(value[key]) === index);
}

export const useReference: UseReferenceHook = ({ bind, field, assignValueEntry }) => {
    const allEntries = useRef<any[]>([]);
    const client = useApolloClient();
    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [model, setModel] = useState<CmsEditorContentModel>(null);
    const [LIST_CONTENT, setListContent] = useState<any>(null);
    const [GET_CONTENT, setGetContent] = useState<any>(null);
    const [entries, setEntries] = useState<any[]>([]);
    const [latestEntries, setLatestEntries] = useState<any[]>([]);
    const [valueEntry, setValueEntry] = useState<ValueEntry>(null);

    const { modelId } = field.settings.models[0];
    const value = bind.value ? bind.value.entryId : null;

    const searchEntries = async () => {
        if (!search) {
            return;
        }

        const { titleFieldId } = model;

        if (!LIST_CONTENT || !search || !titleFieldId) {
            return;
        }

        setLoading(true);
        const { data } = await client.query({
            query: LIST_CONTENT,
            variables: { where: { [`${titleFieldId}_contains`]: search } }
        });

        setLoading(false);

        allEntries.current = distinctBy("id", [...allEntries.current, ...data.content.data]);
        setEntries(data.content.data);
    };

    useEffect(() => {
        searchEntries();
    }, [search]);

    const prepareData = async () => {
        // Fetch ref content model data, to get its title field.
        setLoading(true);
        const refContentModelQuery = await client.query({
            query: GET_CONTENT_MODEL,
            variables: { modelId }
        });

        const refContentModel = get(refContentModelQuery, `data.getContentModel.data`, {});
        setModel(refContentModel);

        // Once we have the refContentModel loaded, this will construct proper list and get queries.
        setListContent(createListQuery(refContentModel));
        setGetContent(createGetQuery(refContentModel));

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
                const selectedEntry = [];
                if (
                    assignValueEntry &&
                    valueEntry &&
                    data.content.data.some(e => e.id === valueEntry.id) === false
                ) {
                    selectedEntry.push({
                        id: valueEntry.id,
                        meta: {
                            status: valueEntry.published ? "published" : "draft",
                            title: valueEntry.name
                        }
                    });
                }
                setLatestEntries(data.content.data.concat(selectedEntry));
                allEntries.current = [...data.content.data];
            });
    }, [modelId, LIST_CONTENT]);

    useEffect(() => {
        if (!value || !model || !model.titleFieldId || !GET_CONTENT) {
            setValueEntry(() => null);
            return;
        }

        const entry = allEntries.current.find(entry => entry.id === value);
        if (entry) {
            // if entry exists set valueEntry to that one so we do not load new one
            setValueEntry({
                id: entry.id,
                published: entry.meta.status === "published",
                name: entry.meta.title
            });
            return;
        }

        setLoading(true);
        client.query({ query: GET_CONTENT, variables: { revision: value } }).then(res => {
            setLoading(false);
            const entry = res.data.content.data;

            const existsInAllEntries = allEntries.current.some(e => e.id === entry.id);
            const existsInLatestEntries = latestEntries.some(e => e.id === entry.id);

            // Calculate a couple of props for the Autocomplete component.
            setValueEntry(() => {
                if (!entry) {
                    return null;
                }
                // assign value to lists if required
                else if (assignValueEntry && !existsInAllEntries) {
                    allEntries.current.push(entry);
                    if (!existsInLatestEntries) {
                        setLatestEntries(prev => prev.concat([entry]));
                    }
                }
                return {
                    id: entry.id,
                    published: entry.meta.status === "published",
                    name: entry.meta.title
                };
            });
        });
    }, [value, GET_CONTENT, model]);

    const onChange = useCallback(value => {
        if (value !== null) {
            const entry = allEntries.current.find(entry => entry.id === value);
            setSearch("");
            setValueEntry({
                id: entry.id,
                published: entry.meta.status === "published",
                name: entry.meta.title
            });
            return bind.onChange({ modelId, entryId: value });
        }

        setValueEntry(() => null);
        bind.onChange(null);
    }, []);

    // Format options for the Autocomplete component.
    const options = useMemo(() => getOptions(entries), [entries]);

    // Format default options for the Autocomplete component.
    const defaultOptions = useMemo(() => getOptions(latestEntries), [latestEntries]);

    return {
        onChange,
        setSearch,
        value: valueEntry,
        loading,
        options: search ? options : defaultOptions || []
    };
};
