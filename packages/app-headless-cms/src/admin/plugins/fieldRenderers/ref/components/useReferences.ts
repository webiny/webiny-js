import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApolloClient, useModelFieldGraphqlContext } from "~/admin/hooks";
import { CmsModelField, CmsModel } from "~/types";
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
import { CmsReferenceContentEntry, OptionItem, OptionItemCollection } from "./types";
import {
    convertReferenceEntriesToOptionCollection,
    convertReferenceEntryToOption
} from "~/admin/plugins/fieldRenderers/ref/components/helpers";

interface UseReferencesParams {
    bind: BindComponentRenderProp;
    field: CmsModelField;
}
export const useReferences = ({ bind, field }: UseReferencesParams) => {
    const isMounted = useRef(true);
    const allEntries = useRef<OptionItemCollection>({});
    const client = useApolloClient();
    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [entries, setEntries] = useState<OptionItemCollection>({});
    const [latestEntries, setLatestEntries] = useState<OptionItem[]>([]);
    const [valueEntries, setValueEntries] = useState<OptionItem[]>([]);
    const requestContext = useModelFieldGraphqlContext();

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
            variables: {
                modelIds: models.map(m => m.modelId),
                query: search
            },
            context: requestContext
        });
        setLoading(false);

        const collection = convertReferenceEntriesToOptionCollection(data.content.data);

        allEntries.current = {
            ...allEntries.current,
            ...collection
        };

        setEntries(collection);
    };

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

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
                fetchPolicy: "network-only",
                context: requestContext
            })
            .then(({ data }) => {
                if (!isMounted.current) {
                    return;
                }

                const collection = convertReferenceEntriesToOptionCollection(data.content.data);
                setLatestEntries(Object.values(collection));
                allEntries.current = {
                    ...collection
                };
            });
    }, [modelsHash]);

    useEffect(() => {
        if (!values || values.length == 0) {
            return;
        }

        setLoading(true);

        client
            .query<CmsEntryGetListResponse, CmsEntryGetListVariables>({
                query: GET_CONTENT_ENTRIES,
                variables: {
                    /**
                     * We need make sure nothing else other than modelId and id is passed to entries variable.
                     */
                    entries: values.map(value => {
                        return {
                            modelId: value.modelId,
                            id: value.id
                        };
                    })
                },
                context: requestContext
            })
            .then(res => {
                if (!isMounted.current) {
                    return;
                }

                setLoading(false);

                const latest = (res.data.latest.data || []).reduce(
                    (collection, item) => {
                        collection[item.entryId] = item;
                        return collection;
                    },
                    {} as Record<string, CmsReferenceContentEntry>
                );

                const entries = (res.data.published.data || []).reduce((collection, item) => {
                    const entryId = item.entryId;
                    const existingItem = latest[entryId];
                    if (existingItem) {
                        collection[entryId] = {
                            ...existingItem,
                            published: {
                                id: item.id,
                                entryId: item.entryId,
                                title: item.title
                            }
                        };
                        return collection;
                    }
                    collection[entryId] = item;
                    return collection;
                }, latest);

                // Calculate a couple of props for the Autocomplete component.
                setValueEntries(Object.values(entries).map(convertReferenceEntryToOption));
            });
    }, []);

    /**
     * onChange callback will update internal component state using the previously loaded entries by IDs.
     * It will also format the value to store to the DB.
     */
    const onChange = useCallback((values: OptionItem[]): void => {
        setSearch("");
        setValueEntries(values);

        // Update parent form
        bind.onChange(
            values.map(item => ({
                modelId: item.modelId,
                id: item.id
            }))
        );
    }, []);

    // Format options for the Autocomplete component.
    const options = useMemo(() => Object.values(entries), [entries]);

    // Format default options for the Autocomplete component.
    const defaultOptions = useMemo(() => Object.values(latestEntries), [latestEntries]);

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
