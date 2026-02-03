import React, { useCallback, useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce.js";
import { useRoute, useRouter } from "@webiny/app-admin";
import { makeDecoratable } from "@webiny/react-composition";
import type { FolderDto, ListMeta } from "@webiny/app-aco";
import { createSort, useAcoList, useNavigateFolder } from "@webiny/app-aco";
import { useContentEntries } from "./useContentEntries.js";
import type { CmsContentEntry, TableItem } from "~/types.js";
import type { OnSortingChange, Sorting } from "@webiny/ui/DataTable/index.js";
import { ROOT_FOLDER } from "~/admin/constants.js";
import { Routes } from "~/routes.js";

interface UpdateSearchCallableParams {
    search: string;
}
interface UpdateSearchCallable {
    (params: UpdateSearchCallableParams): void;
}

export interface ContentEntriesListProviderContext {
    modelId: string;
    folderId: string;
    navigateTo: (folderId?: string) => void;
    folders: FolderDto[];
    getEntryEditUrl: (item: CmsContentEntry) => string;
    hideFilters: () => void;
    isListLoading: boolean;
    isListLoadingMore: boolean;
    isSearch: boolean;
    listMoreRecords: () => void;
    listTitle?: string;
    meta: ListMeta;
    onSelectRow: (rows: TableItem[] | []) => void;
    records: CmsContentEntry[];
    search: string;
    selected: CmsContentEntry[];
    setSearch: (value: string) => void;
    setSelected: (data: CmsContentEntry[]) => void;
    setSorting: OnSortingChange;
    showFilters: () => void;
    showingFilters: boolean;
    showingSelectAll: boolean;
    sorting: Sorting;
    setFilters: (data: Record<string, any>) => void;
    selectAll: () => void;
    unselectAll: () => void;
    isSelectedAll: boolean;
    getWhere: () => Record<string, any>;
    searchQuery: string;
    searchPlaceholder: string;
}

export const ContentEntriesListContext = React.createContext<
    ContentEntriesListProviderContext | undefined
>(undefined);

interface ContentEntriesListProviderProps {
    children: React.ReactNode;
}

export const ContentEntriesListProvider = ({ children }: ContentEntriesListProviderProps) => {
    const { goToRoute, getLink } = useRouter();
    const { route } = useRoute(Routes.ContentEntries.List);
    const { contentModel } = useContentEntries();
    const { currentFolderId } = useNavigateFolder();

    const {
        folders: initialFolders,
        currentFolder,
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
        showingFilters,
        showingSelectAll,
        isSelectedAll,
        selectAll,
        unselectAll,
        getWhere
    } = useAcoList<CmsContentEntry>();

    const [sorting, setSorting] = useState<Sorting>([]);
    const [search, setSearch] = useState<string>("");

    const searchQuery = route.params.search ?? "";

    // Search-related logic: update `searchQuery` state and querystring
    const updateSearch = useCallback(
        debounce<UpdateSearchCallable>(({ search }) => {
            if (searchQuery !== search) {
                setSearchQuery(search);
                goToRoute(Routes.ContentEntries.List, { ...route.params, search });
            }
        }, 500),
        [searchQuery, route]
    );

    useEffect(() => {
        setSearch(route.params.search ?? "");
    }, [route]);

    // When "search" changes, trigger search-related logics
    useEffect(() => {
        updateSearch({ search });
    }, [search]);

    const onSelectRow: ContentEntriesListProviderContext["onSelectRow"] = rows => {
        const items = rows.filter(item => item.$type === "RECORD");

        const cmsContentEntries = items.map(item => item.data as CmsContentEntry);

        setSelected(cmsContentEntries);
    };

    const getEntryEditUrl = useCallback(
        (entry: CmsContentEntry): string => {
            return getLink(Routes.ContentEntries.List, {
                ...route.params,
                folderId: currentFolderId,
                id: entry.id
            });
        },
        [currentFolderId]
    );

    useEffect(() => {
        if (!sorting?.length) {
            return;
        }
        const sort = createSort(
            /**
             * We need to map sorting IDs to match expected CMS values.
             */
            sorting.map(item => {
                const isField = contentModel.fields.some(field => field.fieldId === item.id);

                return {
                    ...item,
                    id: !isField ? item.id : `values_${item.id}`
                };
            })
        );
        if (!sort) {
            return;
        }
        setListSort(sort);
    }, [sorting, contentModel]);

    const navigateTo = useCallback(
        (input?: string) => {
            const folderId = input || currentFolderId || ROOT_FOLDER;

            goToRoute(Routes.ContentEntries.List, { ...route.params, folderId });
        },
        [currentFolderId, route]
    );

    const searchPlaceholder = useMemo(() => {
        if (!currentFolder) {
            return "Search...";
        }

        if (currentFolder.id === ROOT_FOLDER) {
            return `Search all ${contentModel.pluralApiName}`;
        }

        return `Search in "${currentFolder.title}"`;
    }, [currentFolder, contentModel]);

    const context: ContentEntriesListProviderContext = {
        modelId: contentModel.modelId,
        folderId: currentFolderId || ROOT_FOLDER,
        navigateTo,
        folders: initialFolders,
        getEntryEditUrl,
        isListLoading,
        isListLoadingMore,
        isSearch,
        listTitle,
        listMoreRecords,
        meta,
        onSelectRow,
        records: initialRecords,
        search,
        searchPlaceholder,
        selected,
        setSelected,
        setSearch,
        sorting,
        setSorting,
        showingFilters,
        showFilters,
        hideFilters,
        setFilters,
        showingSelectAll,
        isSelectedAll,
        selectAll,
        unselectAll,
        getWhere,
        searchQuery
    };

    return (
        <ContentEntriesListContext.Provider value={context}>
            {children}
        </ContentEntriesListContext.Provider>
    );
};

export const useContentEntriesList = makeDecoratable((): ContentEntriesListProviderContext => {
    const context = React.useContext(ContentEntriesListContext);

    if (!context) {
        throw new Error("useContentEntriesList must be used within a ContentEntriesListContext");
    }

    return context;
});
