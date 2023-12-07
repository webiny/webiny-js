import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "@webiny/react-router";
import debounce from "lodash/debounce";
import omit from "lodash/omit";
import { PAGE_BUILDER_LIST_LINK } from "~/admin/constants";
import { createSort, useAcoList } from "@webiny/app-aco";
import { PbPageDataItem, TableItem } from "~/types";
import { FolderItem, ListMeta, SearchRecordItem } from "@webiny/app-aco/types";
import { OnSortingChange, Sorting } from "@webiny/ui/DataTable";

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
    onSelectRow: (rows: TableItem[] | []) => void;
    records: SearchRecordItem<PbPageDataItem>[];
    search: string;
    selected: SearchRecordItem<PbPageDataItem>[];
    setSearch: (value: string) => void;
    setSelected: (data: SearchRecordItem<PbPageDataItem>[]) => void;
    setSorting: OnSortingChange;
    sorting: Sorting;
    showPreviewDrawer: boolean;
    openPreviewDrawer: (id: string) => void;
    closePreviewDrawer: () => void;
}

export const PagesListContext = React.createContext<PagesListProviderContext | undefined>(
    undefined
);

interface PagesListProviderProps {
    children: React.ReactNode;
}

export const PagesListProvider = ({ children }: PagesListProviderProps) => {
    const { history, location } = useRouter();

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
    } = useAcoList<SearchRecordItem<PbPageDataItem>>();

    const [sorting, setSorting] = useState<Sorting>([]);
    const [search, setSearch] = useState<string>("");
    const [showPreviewPage, setPreviewPage] = useState<string>();
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
    const onSelectRow: PagesListProviderContext["onSelectRow"] = rows => {
        const recordEntries = rows.filter(item => item.$type === "RECORD");
        const pageEntries = recordEntries.map(
            item =>
                omit(item, ["$type", "$selectable"]) as unknown as SearchRecordItem<PbPageDataItem>
        );
        setSelected(pageEntries);
    };

    const openPreviewDrawer = useCallback((id: string) => {
        setPreviewPage(id);
    }, []);

    const closePreviewDrawer = useCallback(() => {
        setPreviewPage(undefined);
    }, []);

    useEffect(() => {
        if (showPreviewPage) {
            query.set("id", showPreviewPage);
            history.push({ search: query.toString() });
            return;
        }

        query.delete("id");
        history.push({ search: query.toString() });
    }, [showPreviewPage]);

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
        closePreviewDrawer,
        folders,
        isListLoading,
        isListLoadingMore,
        isSearch,
        listMoreRecords,
        listTitle,
        meta,
        onSelectRow,
        openPreviewDrawer,
        records,
        search,
        selected,
        setSearch,
        setSelected,
        setSorting,
        showPreviewDrawer: Boolean(showPreviewPage),
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
