import ApolloClient from "apollo-client";
import lodashChunk from "lodash/chunk";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useApolloClient } from "~/admin/hooks";
import {
    CmsReferenceContentEntry,
    CmsReferenceValue as BaseCmsReferenceValue
} from "~/admin/plugins/fieldRenderers/ref/components/types";
import {
    LIST_LATEST_CONTENT_ENTRIES,
    ListLatestCmsEntriesResponse,
    ListLatestCmsEntriesVariables
} from "~/admin/plugins/fieldRenderers/ref/advanced/hooks/graphql";
import { parseIdentifier } from "@webiny/utils";

interface ExecuteSearchParams {
    setLoading: (loading: boolean) => void;
    setError: (error: string | undefined | null) => void;
    setEntries: (entries: Record<string, CmsReferenceContentEntry>) => void;
    client: ApolloClient<any>;
    values: CmsReferenceValue[];
    requestContext?: Record<string, any>;
}

const executeSearch = async (params: ExecuteSearchParams): Promise<void> => {
    const { setLoading, setError, setEntries, client, values, requestContext = {} } = params;
    setLoading(true);
    try {
        const result = await client.query<
            ListLatestCmsEntriesResponse,
            ListLatestCmsEntriesVariables
        >({
            query: LIST_LATEST_CONTENT_ENTRIES,
            variables: {
                entries: values.map(value => {
                    return {
                        id: value.id,
                        modelId: value.modelId
                    };
                })
            },
            context: requestContext
        });
        const error = result.data.entries?.error;
        if (error) {
            setError(error.message);
            return;
        }
        const entries = result.data.entries.data.reduce<Record<string, CmsReferenceContentEntry>>(
            (collection, entry) => {
                collection[entry.entryId] = entry;
                return collection;
            },
            {}
        );
        setError(null);
        setEntries(entries);
    } catch (ex) {
        setError(ex.message);
    } finally {
        setLoading(false);
    }
};

interface CmsReferenceValue extends BaseCmsReferenceValue {
    entryId: string;
}

interface UseReferencesParams {
    values?: BaseCmsReferenceValue[] | BaseCmsReferenceValue | null;
    perPage?: number;
    requestContext?: Record<string, any>;
}

export const useReferences = ({
    values: initialValues,
    perPage = 10,
    requestContext = {}
}: UseReferencesParams) => {
    const client = useApolloClient();
    const [entries, setEntries] = useState<Record<string, CmsReferenceContentEntry>>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | undefined | null>(null);
    const [hash, setHash] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const pages = useMemo(() => {
        const values = Array.isArray(initialValues)
            ? initialValues
            : initialValues
            ? [initialValues]
            : [];
        return lodashChunk<CmsReferenceValue>(
            values.map(value => {
                const { id: entryId } = parseIdentifier(value.id);
                return {
                    ...value,
                    entryId
                };
            }),
            perPage
        );
    }, [initialValues, perPage]);

    const entriesToLoad = useMemo(() => {
        /**
         * We need to make sure that all the previous page entries are loaded
         * And we add the current page entries to the list.
         */
        const toLoad: CmsReferenceValue[] = [];
        for (let p = 0; p <= currentPage; p++) {
            const page = pages[p];
            if (!page || page.length === 0) {
                return toLoad;
            }
            toLoad.push(
                ...page.filter(item => {
                    return !entries[item.entryId];
                })
            );
        }
        return toLoad;
    }, [pages, currentPage]);

    useEffect(() => {
        if (entriesToLoad.length === 0) {
            return;
        }
        const value = entriesToLoad
            .map(item => {
                return item.id;
            })
            .sort()
            .join("-");
        if (value.length === 0) {
            return;
        }
        /**
         * If there is no crypto.subtle, lets skip this - but at this point the hash will be enormous.
         */
        if (!window.crypto?.subtle) {
            if (hash === value) {
                return;
            }
            setHash(value);
            return;
        }

        window.crypto.subtle.digest("SHA-1", new TextEncoder().encode(value)).then(encoded => {
            const decoded = new TextDecoder().decode(encoded);
            if (hash === decoded) {
                return;
            }
            setHash(decoded);
        });
    }, [entriesToLoad]);

    useEffect(() => {
        if (!hash || entriesToLoad.length === 0) {
            return;
        }
        executeSearch({
            client,
            requestContext,
            values: entriesToLoad,
            setLoading,
            setError,
            setEntries: items => {
                setEntries(prev => {
                    return {
                        ...prev,
                        ...items
                    };
                });
            }
        });
    }, [hash]);

    const loadMore = useCallback(() => {
        const nextPage = currentPage + 1;
        if (!pages[nextPage] || pages[nextPage].length === 0) {
            return;
        }
        setCurrentPage(nextPage);
    }, [pages, currentPage]);

    /**
     * This variable contains all the pages with entries, up to the current page, which is inlcuded.
     */
    const loadedEntries = useMemo<CmsReferenceContentEntry[]>(() => {
        const collection: CmsReferenceContentEntry[] = [];
        for (let page = 0; page <= currentPage; page++) {
            const items = pages[page] || [];
            for (const item of items) {
                const entry = entries[item.entryId];
                if (!entry) {
                    continue;
                }
                collection.push(entry);
            }
        }
        return collection;
    }, [currentPage, entries, pages]);

    return {
        loading,
        entries: loadedEntries,
        error,
        loadMore
    };
};
