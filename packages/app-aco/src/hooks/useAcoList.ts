import { useContext, useEffect, useMemo, useState } from "react";
import { FoldersContext } from "~/contexts/folders";
import { SearchRecordsContext } from "~/contexts/records";
import {
    FolderItem,
    GenericSearchData,
    ListMeta,
    ListSearchRecordsSort,
    ListSearchRecordsWhereQueryVariables,
    SearchRecordItem
} from "~/types";
import { sortTableItems, validateOrGetDefaultDbSort } from "~/sorting";

interface UseAcoListParams {
    folderId?: string;
    limit?: number;
    tags_in?: string[];
    tags_startsWith?: string;
    tags_not_startsWith?: string;
}

interface ListRecordsParams {
    // folderId?: string;
    after?: string;
    limit?: number;
    sort?: ListSearchRecordsSort;
    search?: string;
    where?: ListSearchRecordsWhereQueryVariables;
}

interface UseAcoListResponse<T> {
    folders: FolderItem[];
    records: SearchRecordItem<T>[];
    listTitle?: string;
    isListLoading: boolean;
    isListLoadingMore: boolean;
    meta: ListMeta;
    limit: number;
    listItems: (params: ListRecordsParams) => void;
}

const defaultMeta: ListMeta = {
    totalCount: 0,
    hasMoreItems: false,
    cursor: null
};

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
    currentFolderId?: string
): SearchRecordItem<T>[] => {
    if (!records) {
        return [];
    }

    if (!currentFolderId) {
        return records;
    }

    return records.filter(
        (record): record is SearchRecordItem<T> => record.location?.folderId === currentFolderId
    );
};

export const useAcoList = <T = GenericSearchData>(params: UseAcoListParams) => {
    const { folderId, limit: initialLimit = 50, ...initialWhere } = params;

    const folderContext = useContext(FoldersContext);
    const searchContext = useContext(SearchRecordsContext);

    if (!folderContext || !searchContext) {
        throw new Error("useAcoList must be used within a ACOProvider");
    }

    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [records, setRecords] = useState<SearchRecordItem<T>[]>([]);
    const [listTitle, setListTitle] = useState<string | undefined>();
    const [sort, setSort] = useState<ListSearchRecordsSort>();

    const { folders: originalFolders, loading: foldersLoading, listFolders } = folderContext;
    const { records: originalRecords, loading: recordsLoading, listRecords, meta } = searchContext;

    /**
     * On first mount, call `listFolders` and `listRecords`, which will either issue a network request, or load folders and records from cache.
     * We don't need to store the result of it to any local state; that is managed by the context provider.
     *
     * IMPORTANT: we check if the folders[type] array exists: the hook can be used from multiple components and
     * fetch the outdated list from Apollo Cache. Since the state is managed locally, we fetch the folders only
     * at the first mount.
     *
     * We also pass the current `sort` state to `listRecords` so we are able to fetch records according to the previous `sort` value set by the user.
     */
    useEffect(() => {
        if (!originalFolders) {
            listFolders();
        }

        let where: ListSearchRecordsWhereQueryVariables | undefined;
        if (Object.keys(initialWhere).length > 0) {
            where = {
                ...initialWhere
            };
        }
        if (folderId) {
            if (!where) {
                where = {};
            }
            where.location = {
                folderId
            };
        }

        listRecords({
            where,
            sort,
            limit: initialLimit,
            after: undefined,
            search: undefined
        });
    }, [folderId]);

    /**
     * Any time we receive a `folders` list update:
     * - we return the list filtered by the current `type` and parent `folderId`, sorted according to the current `sort` value;
     * - we return the current folder name.
     */
    useEffect(() => {
        const subFolders = getCurrentFolderList(originalFolders, folderId);
        setFolders(() => {
            return sortTableItems(subFolders, sort);
        });

        const currentFolder = originalFolders?.find(folder => folder.id === folderId);
        setListTitle(currentFolder?.title || undefined);
    }, [originalFolders, folderId]);

    /**
     * Any time we receive a `records` list or `folderId` update:
     * - we return the `records` list filtered by the current `folderId`.
     */
    useEffect(() => {
        const subRecords = getCurrentRecordList<T>(
            originalRecords as SearchRecordItem<T>[],
            folderId
        );
        setRecords(subRecords);
    }, [originalRecords, folderId, setRecords]);

    /**
     * Any time we receive a new `sort` value:
     * - we sort the current `folders` list according to `sort` value;
     */
    useEffect(() => {
        setFolders(prev => {
            return sortTableItems(prev, sort);
        });
    }, [sort, setFolders]);

    return useMemo<UseAcoListResponse<T>>(() => {
        return {
            folders,
            records,
            listTitle,
            limit: initialLimit,
            isListLoading: Boolean(
                recordsLoading.INIT ||
                    foldersLoading.INIT ||
                    recordsLoading.LIST ||
                    foldersLoading.LIST
            ),
            isListLoadingMore: Boolean(recordsLoading.LIST_MORE),
            meta: meta[folderId || "search"] || defaultMeta,
            listItems({ where, sort: initialSort, after, limit = initialLimit, search }) {
                let sort: ListSearchRecordsSort | undefined = undefined;
                // We store `sort` param to local state to handle `folders` and future `records` sorting.
                if (initialSort?.length) {
                    sort = validateOrGetDefaultDbSort(initialSort);
                    setSort(sort);
                }
                if (folderId) {
                    where = {
                        ...(where || {}),
                        location: {
                            folderId
                        }
                    };
                }

                const params: ListRecordsParams = {
                    where: !where || Object.keys(where).length === 0 ? undefined : where,
                    sort,
                    limit,
                    after,
                    search
                };

                return listRecords(params);
            }
        };
    }, [folders, records, foldersLoading, recordsLoading, meta, initialWhere]);
};
