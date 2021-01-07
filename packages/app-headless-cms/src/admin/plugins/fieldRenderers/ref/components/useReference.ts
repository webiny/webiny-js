import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import get from "lodash/get";
import { useApolloClient } from "@webiny/app-headless-cms/admin/hooks";
import { createListQuery, createGetQuery, GET_CONTENT_MODEL } from "./graphql";
import { getOptions } from "./getOptions";
import { CmsEditorContentModel } from "@webiny/app-headless-cms/types";

type ValueEntry = {
    id: string;
    published: boolean;
    name: string;
};

function distinctBy(key, array) {
    const keys = array.map(value => value[key]);
    return array.filter((value, index) => keys.indexOf(value[key]) === index);
}

export const useReference = ({ bind, field }) => {
    const allEntries = useRef([]);
    const client = useApolloClient();
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [model, setModel] = useState<CmsEditorContentModel>(null);
    const [LIST_CONTENT, setListContent] = useState(null);
    const [GET_CONTENT, setGetContent] = useState(null);
    const [entries, setEntries] = useState([]);
    const [latestEntries, setLatestEntries] = useState([]);
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
                setLatestEntries(data.content.data);
                allEntries.current = [...data.content.data];
            });
    }, [modelId, LIST_CONTENT]);

    useEffect(() => {
        if (!value || !model || !model.titleFieldId || !GET_CONTENT) {
            setValueEntry(null);
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

            // Calculate a couple of props for the Autocomplete component.
            setValueEntry(
                entry
                    ? {
                          id: entry.id,
                          published: entry.meta.status === "published",
                          name: entry.meta.title
                      }
                    : null
            );
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

        setValueEntry(null);
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
