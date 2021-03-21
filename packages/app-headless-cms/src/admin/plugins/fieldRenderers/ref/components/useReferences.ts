import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import get from "lodash/get";
import { useApolloClient } from "~/admin/hooks";
import { createListQuery, createGetByIdsQuery, GET_CONTENT_MODEL } from "./graphql";
import { getOptions } from "./getOptions";
import { CmsEditorContentModel } from "~/types";

type ValueEntry = {
    id: string;
    published: boolean;
    name: string;
};

function distinctBy(key, array) {
    const keys = array.map(value => value[key]);
    return array.filter((value, index) => keys.indexOf(value[key]) === index);
}

export const useReferences = ({ bind, field }) => {
    const allEntries = useRef([]);
    const client = useApolloClient();
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [model, setModel] = useState<CmsEditorContentModel>(null);
    const [LIST_CONTENT, setListContent] = useState(null);
    const [GET_BY_IDS, setGetByIds] = useState(null);
    const [entries, setEntries] = useState([]);
    const [latestEntries, setLatestEntries] = useState([]);
    const [valueEntries, setValueEntries] = useState<ValueEntry[]>([]);

    const { modelId } = field.settings.models[0];
    const values = bind.value ? bind.value.map(v => v.entryId) : [];

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
            variables: { limit: 10, where: { [`${titleFieldId}_contains`]: search } }
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
        setGetByIds(createGetByIdsQuery(refContentModel));

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
    }, [LIST_CONTENT]);

    useEffect(() => {
        if (!values || !values.length || !model || !model.titleFieldId || !GET_BY_IDS) {
            return;
        }

        if (values.length) {
            setLoading(true);

            client.query({ query: GET_BY_IDS, variables: { revisions: values } }).then(res => {
                setLoading(false);
                const entries = res.data.content.data;

                // Calculate a couple of props for the Autocomplete component.
                setValueEntries(
                    entries.map(entry => ({
                        id: entry.id,
                        published: entry.meta.status === "published",
                        name: entry.meta.title
                    }))
                );
            });
        }
    }, [GET_BY_IDS]);

    /**
     * onChange callback will update internal component state using the previously loaded entries by IDs.
     * It will also format the value to store to the DB.
     */
    const onChange = useCallback(values => {
        setSearch("");
        setValueEntries(values);

        // Update parent form
        bind.onChange(values.map(item => ({ modelId, entryId: item.id })));
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
