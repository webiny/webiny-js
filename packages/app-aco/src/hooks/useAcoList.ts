import dotPropImmutable from "dot-prop-immutable";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FoldersContext } from "~/contexts/folders";
import { SearchRecordsContext } from "~/contexts/records";
import {
    FolderItem,
    GenericSearchData,
    ListMeta,
    ListSearchRecordsQueryVariables,
    ListSearchRecordsSort,
    ListSearchRecordsWhereQueryVariables,
    SearchRecordItem
} from "~/types";
import { createSort, sortTableItems, validateOrGetDefaultDbSort } from "~/sorting";
import { useAcoApp } from "~/hooks/useAcoApp";
import { useNavigateFolder } from "~/hooks/useNavigateFolder";
import cloneDeep from "lodash/cloneDeep";
import set from "lodash/set";
import unset from "lodash/unset";
import { OnSortingChange, Sorting } from "@webiny/ui/DataTable";

interface UseAcoListResponse<T> {
    folders: FolderItem[];
    records: SearchRecordItem<T>[];
    listTitle?: string;
    isListLoading: boolean;
    isListLoadingMore: boolean;
    isSearch: boolean;
    meta: ListMeta;
    limit: number;
    listMoreRecords: () => void;
    listParams: ListSearchRecordsQueryVariables;
    setListParams: (params: ListSearchRecordsQueryVariables) => void;
    setSorting: OnSortingChange;
    sorting: Sorting;
}

const getCurrentFolderList = (
    folders?: FolderItem[] | null,
    currentFolderId?: string
): FolderItem[] | [] => {
    if (!folders) {
        return [];
    }
    if (!currentFolderId || currentFolderId.toLowerCase() === "root") {
        return folders.filter(
            folder => !folder.parentId || folder.parentId.toLowerCase() === "root"
        );
    }
    return folders.filter(folder => folder.parentId === currentFolderId);
};

const getCurrentRecordList = <T = GenericSearchData>(
    records: SearchRecordItem<T>[],
    folderIdPath: string,
    currentFolderId?: string
): SearchRecordItem<T>[] => {
    if (!records) {
        return [];
    }

    if (!currentFolderId) {
        return records;
    }

    return records.filter(
        (record): record is SearchRecordItem<T> =>
            dotPropImmutable.get(record, folderIdPath) === currentFolderId
    );
};

export const useAcoList = <T = GenericSearchData>() => {
    const { currentFolderId = "ROOT" } = useNavigateFolder();
    const { folderIdPath } = useAcoApp();
    const folderContext = useContext(FoldersContext);
    const searchContext = useContext(SearchRecordsContext);

    if (!folderContext || !searchContext) {
        throw new Error("useAcoList must be used within a ACOProvider");
    }

    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [records, setRecords] = useState<SearchRecordItem<T>[]>([]);
    const [listTitle, setListTitle] = useState<string | undefined>();
    const [sorting, setSorting] = useState<Sorting>([]);
    const [isSearch, setIsSearch] = useState<boolean>(false);
    const [listParams, setListParamsState] = useState<ListSearchRecordsQueryVariables>({});

    const { folders: originalFolders, loading: foldersLoading, listFolders } = folderContext;
    const { records: originalRecords, loading: recordsLoading, listRecords, meta } = searchContext;

    // Utility function to handle `listRecords` params
    const setListParams = (params: ListSearchRecordsQueryVariables) => {
        setListParamsState(prev => {
            const next = cloneDeep(prev);

            Object.entries(params).forEach(([key, value]) => {
                if (typeof value !== "undefined") {
                    set(next, key, value);
                } else {
                    unset(next, key);
                }
            });

            return next;
        });
    };

    // Utility function that keep track of different piece of state (e.g. sort, where) and set them as listParams
    const listItems = ({
        where: initialWhere,
        sort: initialSort,
        after,
        limit = 50,
        search
    }: ListSearchRecordsQueryVariables) => {
        let sort: ListSearchRecordsSort | undefined = undefined;

        // We store `sort` param to local state to handle `folders` and future `records` sorting.
        if (initialSort?.length) {
            sort = validateOrGetDefaultDbSort(initialSort);
        }

        // Store internally in case this is a search query: based on this we will modify the returned records and folders
        setIsSearch(Boolean(search));

        let where = {
            ...(initialWhere || {})
        };

        if (currentFolderId && (!where || Object.keys(where).length === 0)) {
            where = dotPropImmutable.set(where, folderIdPath, currentFolderId);
        }

        const params: ListSearchRecordsQueryVariables = {
            where: !where || Object.keys(where).length === 0 ? undefined : where,
            sort,
            limit,
            after,
            search
        };

        return listRecords(params);
    };

    /**
     * On first mount, call `listFolders` and `setListParams`, which will either issue a network request, or load folders and records from cache.
     * We don't need to store the result of it to any local state; that is managed by the context provider.
     *
     * IMPORTANT: we check if the folders[type] array exists: the hook can be used from multiple components and
     * fetch the outdated list from Apollo Cache. Since the state is managed locally, we fetch the folders only
     * at the first mount.
     *
     * We don't call `listRecords` directly, instead we call `setListParams` making it the only driver to fetch records from the apis.
     */
    useEffect(() => {
        if (!originalFolders) {
            listFolders();
        }

        let where: ListSearchRecordsWhereQueryVariables | undefined;

        if (currentFolderId) {
            where = dotPropImmutable.set(where || {}, folderIdPath, currentFolderId);
        }

        setListParams({
            where,
            sort: createSort(sorting),
            limit: 50,
            after: undefined,
            search: undefined
        });

        // Reset search flag any time we receive a new `folderId`
        setIsSearch(false);
    }, [currentFolderId]);

    /**
     * Any time we receive a `folders` list update:
     * - we set an empty array in case of search;
     * - we set the list filtered by the current `type` and parent `folderId`, sorted according to the current `sort` value;
     * - we set the current folder name.
     */
    useEffect(() => {
        if (isSearch) {
            setFolders([]);
            return;
        }

        const subFolders = getCurrentFolderList(originalFolders, currentFolderId);
        setFolders(() => {
            return sortTableItems(subFolders, createSort(sorting));
        });

        const currentFolder = originalFolders?.find(folder => folder.id === currentFolderId);
        setListTitle(currentFolder?.title);
    }, [originalFolders, currentFolderId, isSearch]);

    /**
     * Any time we receive a `records` list or `folderId` update:
     * - we set all `records` in case of search query;
     * - we set the `records` list filtered by the current `folderId`.
     */
    useEffect(() => {
        if (isSearch) {
            setRecords(originalRecords as SearchRecordItem<T>[]);
            return;
        }

        const subRecords = getCurrentRecordList<T>(
            originalRecords as SearchRecordItem<T>[],
            folderIdPath,
            currentFolderId
        );
        setRecords(subRecords);
    }, [originalRecords, currentFolderId, setRecords, isSearch]);

    /**
     * Any time we receive a new `sort` value:
     * - we sort the current `folders` list according to `sorting` value;
     */
    useEffect(() => {
        setFolders(prev => {
            return sortTableItems(prev, createSort(sorting));
        });
    }, [sorting, setFolders]);

    /**
     * Any time we receive a new `sorting` value:
     * - we sort the current `records` list according to `sorting` value;
     */
    useEffect(() => {
        if (!sorting?.length) {
            setListParams({ sort: undefined });
        }
        setListParams({ sort: createSort(sorting) });
    }, [sorting]);

    /**
     * Utility function to list/load more records, the `meta` state is tracked internally.
     */
    const listMoreRecords = useCallback(() => {
        const { hasMoreItems, cursor } = meta;
        if (hasMoreItems && cursor) {
            setListParams({ after: cursor });
        }
    }, [meta, setListParams]);

    /**
     * Any time we receive a new `listParams` value:
     * - we fetch records according to the new params
     */
    useEffect(() => {
        const listRecords = async () => {
            await listItems(listParams);
        };
        listRecords();
    }, [listParams]);

    return useMemo<UseAcoListResponse<T>>(() => {
        return {
            folders,
            records,
            listTitle,
            isSearch,
            limit: 50,
            isListLoading: Boolean(
                recordsLoading.INIT ||
                    foldersLoading.INIT ||
                    recordsLoading.LIST ||
                    foldersLoading.LIST
            ),
            isListLoadingMore: Boolean(recordsLoading.LIST_MORE),
            meta,
            listParams,
            setListParams,
            sorting,
            setSorting,
            listMoreRecords
        };
    }, [folders, records, foldersLoading, recordsLoading, meta, isSearch, listParams, sorting]);
};
