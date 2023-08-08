import React, { useCallback, useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce";
import { useRouter } from "@webiny/react-router";
import { useContentEntries } from "./useContentEntries";
import { CmsContentEntry } from "~/types";
import { OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { useAcoList, createSort } from "@webiny/app-aco";
import { CMS_ENTRY_LIST_LINK } from "~/admin/constants";
import { ListMeta } from "@webiny/app-aco/types";
import {
    isRecordEntry,
    transformCmsContentEntriesToRecordEntries,
    transformFolderItemsToFolderEntries
} from "~/utils/acoRecordTransform";
import { FolderEntry, RecordEntry } from "~/admin/components/ContentEntries/Table/types";
import { TableProps } from "~/admin/components/ContentEntries/Table";

interface UpdateSearchCallableParams {
    search: string;
    query: URLSearchParams;
}
interface UpdateSearchCallable {
    (params: UpdateSearchCallableParams): void;
}

export interface ContentEntriesListProviderContext {
    folders: FolderEntry[];
    hideFilters: () => void;
    isListLoading: boolean;
    isListLoadingMore: boolean;
    isSearch: boolean;
    listMoreRecords: () => void;
    listTitle?: string;
    meta: ListMeta;
    onSelectRow: TableProps["onSelectRow"];
    records: RecordEntry[];
    search: string;
    selected: CmsContentEntry[];
    setSearch: (value: string) => void;
    setSorting: OnSortingChange;
    showFilters: () => void;
    showingFilters: boolean;
    sorting: Sorting;
    setFilters: (data: Record<string, any>) => void;
}

export const ContentEntriesListContext = React.createContext<
    ContentEntriesListProviderContext | undefined
>(undefined);

interface ContentEntriesListProviderProps {
    children: React.ReactNode;
}

export const ContentEntriesListProvider = ({ children }: ContentEntriesListProviderProps) => {
    const { history } = useRouter();
    const { contentModel } = useContentEntries();

    const {
        folders: initialFolders,
        isListLoading,
        isListLoadingMore,
        isSearch,
        listMoreRecords,
        listTitle,
        meta,
        records: initialRecords,
        setSearchQuery,
        setListSort,
        setFilters,
        showFilters,
        hideFilters,
        showingFilters
    } = useAcoList();

    const [sorting, setSorting] = useState<Sorting>([]);
    const [search, setSearch] = useState<string>("");
    const [selected, setSelected] = useState<CmsContentEntry[]>([]);
    const query = new URLSearchParams(location.search);
    const searchQuery = query.get("search") || "";
    const baseUrl = `${CMS_ENTRY_LIST_LINK}/${contentModel.modelId}`;

    // Search-related logics: update `searchQuery` state and querystring
    const updateSearch = useCallback(
        debounce<UpdateSearchCallable>(({ search, query }) => {
            const searchQuery = query.get("search");

            if (typeof searchQuery !== "string" && !search) {
                return;
            }

            setSearchQuery(search);

            if (searchQuery !== search) {
                if (!search) {
                    // In case of empty `search` - remove it from `querystring`
                    query.delete("search");
                } else {
                    // Otherwise, add it to `querystring`
                    query.set("search", search);
                }
                history.push(`${baseUrl}?${query.toString()}`);
            }
        }, 500),
        [baseUrl]
    );

    // Set "search" from search "query" on page load.
    useEffect(() => {
        setSearch(searchQuery);
    }, [searchQuery]);

    // When "search" changes, trigger search-related logics
    useEffect(() => {
        updateSearch({ search, query });
    }, [search]);

    const onSelectRow: TableProps["onSelectRow"] = rows => {
        const recordEntries = rows.filter(isRecordEntry) as RecordEntry[];
        const cmsContentEntries = recordEntries.map(record => record.original);
        setSelected(cmsContentEntries);
    };

    const records = useMemo(() => {
        return transformCmsContentEntriesToRecordEntries(
            initialRecords as unknown as CmsContentEntry[]
        );
    }, [initialRecords]);

    const folders = useMemo(() => {
        return transformFolderItemsToFolderEntries(initialFolders);
    }, [initialFolders]);

    useEffect(() => {
        if (!sorting?.length) {
            return;
        }
        const sort = createSort(sorting);
        if (!sort) {
            return;
        }
        setListSort(sort);
    }, [sorting]);

    const context: ContentEntriesListProviderContext = {
        folders,
        isListLoading,
        isListLoadingMore,
        isSearch,
        listTitle,
        listMoreRecords,
        meta,
        onSelectRow,
        records,
        search,
        selected,
        setSearch,
        sorting,
        setSorting,
        showingFilters,
        showFilters,
        hideFilters,
        setFilters
    };

    return (
        <ContentEntriesListContext.Provider value={context}>
            {children}
        </ContentEntriesListContext.Provider>
    );
};

export const useContentEntriesList = (): ContentEntriesListProviderContext => {
    const context = React.useContext(ContentEntriesListContext);

    if (!context) {
        throw new Error("useContentEntriesList must be used within a ContentEntriesListContext");
    }

    return context;
};
