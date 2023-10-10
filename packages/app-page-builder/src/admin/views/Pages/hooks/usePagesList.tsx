import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "@webiny/react-router";
import debounce from "lodash/debounce";
import { PAGE_BUILDER_LIST_LINK } from "~/admin/constants";
import { createSort, useAcoList } from "@webiny/app-aco";
import { PbPageDataItem } from "~/types";
import { FolderItem, ListMeta, SearchRecordItem } from "@webiny/app-aco/types";
import { OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { PageEntry, TableProps, isPageEntry } from "~/admin/components/Table/Table";

interface UpdateSearchCallableParams {
    search: string;
    query: URLSearchParams;
}

interface UpdateSearchCallable {
    (params: UpdateSearchCallableParams): void;
}

interface PagesListProviderContext {
    folders: FolderItem[];
    isListLoading: boolean;
    isListLoadingMore: boolean;
    isSearch: boolean;
    listMoreRecords: () => void;
    listTitle?: string;
    meta: ListMeta;
    onSelectRow: TableProps["onSelectRow"];
    records: SearchRecordItem<PbPageDataItem>[];
    search: string;
    selected: PbPageDataItem[];
    setSearch: (value: string) => void;
    setSelected: (data: PbPageDataItem[]) => void;
    setSorting: OnSortingChange;
    sorting: Sorting;
}

export const PagesListContext = React.createContext<PagesListProviderContext | undefined>(
    undefined
);

interface PagesListProviderProps {
    children: React.ReactNode;
}

export const PagesListProvider = ({ children }: PagesListProviderProps) => {
    const { history } = useRouter();

    const {
        folders,
        isListLoading,
        isListLoadingMore,
        isSearch,
        listMoreRecords,
        listTitle,
        meta,
        records,
        selected,
        setSearchQuery,
        setSelected,
        setListSort
    } = useAcoList<PbPageDataItem>();

    const [sorting, setSorting] = useState<Sorting>([]);
    const [search, setSearch] = useState<string>("");
    const query = new URLSearchParams(location.search);
    const searchQuery = query.get("search") || "";

    // Search-related logics: update `listParams` and update querystring
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
                history.push(`${PAGE_BUILDER_LIST_LINK}?${query.toString()}`);
            }
        }, 500),
        []
    );

    // Set "search" from search "query" on page load.
    useEffect(() => {
        setSearch(searchQuery);
    }, [searchQuery]);

    // When "search" changes, trigger search-related logics
    useEffect(() => {
        updateSearch({ search, query });
    }, [search]);

    // Handle rows selection.
    const onSelectRow: TableProps["onSelectRow"] = rows => {
        const recordEntries = rows.filter(isPageEntry) as PageEntry[];
        const pageEntries = recordEntries.map(record => record.original);
        setSelected(pageEntries);
    };

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

    const context: PagesListProviderContext = {
        folders,
        isListLoading,
        isListLoadingMore,
        isSearch,
        listMoreRecords,
        listTitle,
        meta,
        onSelectRow,
        records,
        search,
        selected,
        setSearch,
        setSelected,
        setSorting,
        sorting
    };

    return <PagesListContext.Provider value={context}>{children}</PagesListContext.Provider>;
};

export const usePagesList = (): PagesListProviderContext => {
    const context = React.useContext(PagesListContext);

    if (!context) {
        throw new Error("usePagesList must be used within a PagesListContext");
    }

    return context;
};
