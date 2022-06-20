import { useMemo, useState, useEffect } from "react";
import get from "lodash/get";
import debounce from "lodash/debounce";
import {
    LIST_LATEST_CMS_ENTRIES,
    ListLatestCmsEntriesQueryResponse,
    ListLatestCmsEntriesQueryVariables,
    SEARCH_CMS_ENTRIES,
    SearchCmsEntriesQueryResponse,
    SearchCmsEntriesQueryVariables
} from "~/graphql/workflow.gql";
import { BindComponentRenderProp } from "@webiny/form";
import { CmsEntry, CmsModel } from "~/types";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { useQueryLocale } from "@webiny/app-headless-cms/admin/hooks";

export interface CmsEntryOption {
    id: string;
    name: string;
    model: {
        name: string;
        modelId: string;
    };
}
interface SelectedEntryValue {
    id: string;
    modelId: string;
}
interface UseCmsEntriesResult {
    loading: boolean;
    query: string;
    setQuery: (query: string) => void;
    options: CmsEntryOption[];
    value: CmsEntryOption[];
}

interface UseCmsEntriesParams {
    bind: BindComponentRenderProp;
    models: CmsModel[];
}

export const useCmsEntries = ({ bind, models }: UseCmsEntriesParams): UseCmsEntriesResult => {
    const [query, setQuery] = useState<string>("");
    const [search, setSearch] = useState<string>(query);
    const [items, setItems] = useState<Record<string, CmsEntryOption> | null>(null);
    const selectedValues: SelectedEntryValue[] = Array.isArray(bind.value) ? bind.value : [];

    const { getCurrentLocale } = useI18N();

    const locale = getCurrentLocale("content");
    if (!locale) {
        throw new Error("Missing current content locale.");
    }

    const performSearch = useMemo(() => {
        return debounce((q: string) => setSearch(q), 250);
    }, []);
    /**
     * Perform debounced search whenever "query" has changed.
     */
    useEffect(() => {
        performSearch(query);
    }, [query]);

    const setItemsFromEntries = (entries: CmsEntry[] | null) => {
        if (!entries || entries.length === 0) {
            return;
        }
        setItems(prev => {
            return entries.reduce((collection, entry) => {
                if (!collection[entry.entryId]) {
                    collection[entry.entryId] = {
                        id: entry.entryId,
                        name: entry.title,
                        model: entry.model
                    };
                }
                return collection;
            }, prev || {});
        });
    };
    /**
     * Load all the entries that are already selected - only initial mount
     */
    useQueryLocale<ListLatestCmsEntriesQueryResponse, ListLatestCmsEntriesQueryVariables>(
        LIST_LATEST_CMS_ENTRIES,
        locale,
        {
            skip: items !== null || selectedValues.length === 0,
            variables: {
                entries: selectedValues
            },
            onCompleted: response => {
                if (!response) {
                    return;
                }
                const entries: CmsEntry[] | null = get(response, "entries.data");

                setItemsFromEntries(entries);
            }
        }
    );
    /**
     * Load the entries that are being searched for.
     */
    const { data, loading } = useQueryLocale<
        SearchCmsEntriesQueryResponse,
        SearchCmsEntriesQueryVariables
    >(SEARCH_CMS_ENTRIES, locale, {
        skip: models.length === 0 || !search,
        variables: {
            query: search,
            modelIds: models.map(model => model.modelId),
            limit: 100,
            fields: []
        }
    });

    const entries: CmsEntry[] = get(data, "entries.data", []);

    useEffect(() => {
        if (!entries || entries.length === 0) {
            return;
        }
        setItemsFromEntries(entries);
    }, [entries]);
    /**
     * Prepare the list of options for the AutoComplete.
     */
    const options = useMemo<CmsEntryOption[]>(
        () =>
            entries.map(entry => {
                return {
                    id: entry.entryId,
                    name: entry.title,
                    model: entry.model
                };
            }),
        [entries]
    );
    /**
     * Prepare value for the AutoComplete.
     */
    const value = useMemo<CmsEntryOption[]>(
        () =>
            Object.values(items || {}).filter(item =>
                selectedValues.some(value => value.id === item.id)
            ),
        [items, selectedValues]
    );

    return {
        options,
        loading,
        query,
        setQuery,
        value
    };
};
