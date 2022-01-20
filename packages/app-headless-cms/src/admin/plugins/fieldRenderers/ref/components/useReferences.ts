import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApolloClient } from "~/admin/hooks";
import * as GQL from "./graphql";
import { getOptions } from "./getOptions";

type ValueEntry = {
    id: string;
    modelId: string;
    modelName: string;
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
    const [entries, setEntries] = useState([]);
    const [latestEntries, setLatestEntries] = useState([]);
    const [valueEntries, setValueEntries] = useState<ValueEntry[]>([]);

    const { models } = field.settings;
    const modelsHash = models.join(",");
    const values = bind.value ? bind.value : [];

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

        allEntries.current = distinctBy("id", [...allEntries.current, ...data.content.data]);
        setEntries(data.content.data);
    };

    useEffect(() => {
        searchEntries();
    }, [search]);

    useEffect(() => {
        client
            .query({
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
            .query({ query: GQL.GET_CONTENT_ENTRIES, variables: { entries: values } })
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
    const onChange = useCallback(values => {
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
