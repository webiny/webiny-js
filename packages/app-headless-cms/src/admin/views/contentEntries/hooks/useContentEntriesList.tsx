import React, { useCallback, useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce";
import omit from "lodash/omit";
import { useRouter } from "@webiny/react-router";
import { useContentEntries } from "./useContentEntries";
import { CmsContentEntry, EntryTableItem, TableItem } from "~/types";
import { OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import {
    useAcoList,
    createSort,
    useNavigateFolder,
    createRecordsData,
    createFoldersData
} from "@webiny/app-aco";
import { CMS_ENTRY_LIST_LINK } from "~/admin/constants";
import { FolderTableItem, ListMeta } from "@webiny/app-aco/types";
import { usePermission } from "~/admin/hooks";

interface UpdateSearchCallableParams {
    search: string;
    query: URLSearchParams;
}
interface UpdateSearchCallable {
    (params: UpdateSearchCallableParams): void;
}

export interface ContentEntriesListProviderContext {
    folders: FolderTableItem[];
    hideFilters: () => void;
    isListLoading: boolean;
    isListLoadingMore: boolean;
    isSearch: boolean;
    listMoreRecords: () => void;
    listTitle?: string;
    meta: ListMeta;
    onSelectRow: (rows: TableItem[] | []) => void;
    onEditEntry: (item: EntryTableItem) => void;
    records: EntryTableItem[];
    search: string;
    selected: CmsContentEntry[];
    setSearch: (value: string) => void;
    setSelected: (data: CmsContentEntry[]) => void;
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
    const { currentFolderId } = useNavigateFolder();
    const { canEdit } = usePermission();

    const {
        folders: initialFolders,
        isListLoading,
        isListLoadingMore,
        isSearch,
        listMoreRecords,
        listTitle,
        meta,
        records: initialRecords,
        selected,
        setSearchQuery,
        setListSort,
        setFilters,
        setSelected,
        showFilters,
        hideFilters,
        showingFilters
    } = useAcoList<CmsContentEntry>();

    const [sorting, setSorting] = useState<Sorting>([]);
    const [search, setSearch] = useState<string>("");
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

    const onSelectRow: ContentEntriesListProviderContext["onSelectRow"] = rows => {
        const items = rows.filter(item => item.$type === "RECORD");

        const cmsContentEntries = items
            .map(item => omit(item, ["$type", "$selectable"]))
            .map(item => item as unknown as CmsContentEntry);

        setSelected(cmsContentEntries);
    };

    const onEditEntry = useCallback(
        (entry: EntryTableItem) => {
            if (!canEdit(entry, "cms.contentEntry")) {
                return;
            }

            const folderPath = currentFolderId
                ? `&folderId=${encodeURIComponent(currentFolderId)}`
                : "";

            const idPath = encodeURIComponent(entry.id);

            history.push(`${baseUrl}?id=${idPath}${folderPath}`);
        },
        [canEdit, baseUrl, currentFolderId]
    );

    const records = useMemo(() => {
        return createRecordsData(initialRecords);
    }, [initialRecords]);

    const folders = useMemo(() => {
        return createFoldersData(initialFolders);
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
        onEditEntry,
        records,
        search,
        selected,
        setSelected,
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
