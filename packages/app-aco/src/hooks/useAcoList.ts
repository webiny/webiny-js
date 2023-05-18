import { useContext, useEffect, useMemo, useState } from "react";
import { FoldersContext } from "~/contexts/folders";
import { AcoAppContext } from "~/contexts/app";
import { ListRecordsParams, SearchRecordsContext } from "~/contexts/records";
import { sortTableItems, validateOrGetDefaultDbSort } from "~/sorting";
import { FolderItem, ListDbSort, ListMeta, SearchRecordItem } from "~/types";

interface ListItemsParams extends Omit<ListRecordsParams, "folderId"> {
    folderId?: string;
}

interface UseAcoListResponse {
    folders: FolderItem[];
    records: SearchRecordItem[];
    listTitle: string | undefined;
    isListLoading?: boolean;
    isListLoadingMore?: boolean;
    meta: ListMeta;
    listItems: (params: ListItemsParams) => Promise<any>;
}

export const useAcoList = (originalFolderId?: string) => {
    const folderContext = useContext(FoldersContext);
    const searchContext = useContext(SearchRecordsContext);
    const appContext = useContext(AcoAppContext);

    if (!folderContext || !searchContext || !appContext) {
        throw new Error("useAcoList must be used within a ACOProvider");
    }

    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [records, setRecords] = useState<SearchRecordItem[]>([]);
    const [listTitle, setListTitle] = useState<string | undefined>();
    const [sort, setSort] = useState<ListDbSort>(validateOrGetDefaultDbSort());

    const { folders: originalFolders, loading: foldersLoading, listFolders } = folderContext;
    const { records: originalRecords, loading: recordsLoading, listRecords, meta } = searchContext;

    const folderId = originalFolderId || "ROOT";

    const getCurrentFolderList = (
        folders?: FolderItem[] | null,
        currentFolderId?: string
    ): FolderItem[] | [] => {
        if (!folders) {
            return [];
        }
        if (currentFolderId) {
            return folders.filter(folder => folder.parentId === currentFolderId);
        }
        return folders.filter(folder => !folder.parentId);
    };

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

        listRecords({ folderId, sort });
    }, [folderId]);

    /**
     * Any time we receive a `folders` list update:
     * - we return the list filtered by the parent `folderId`, sorted according to the current `sort` value;
     * - we return the current folder name.
     */
    useEffect(() => {
        const subFolders = getCurrentFolderList(originalFolders, originalFolderId);
        setFolders(sortTableItems(subFolders, sort));

        const currentFolder = originalFolders?.find(folder => folder.id === originalFolderId);
        setListTitle(currentFolder?.title || undefined);
    }, [originalFolders]);

    /**
     * Any time we receive a `records` list or `folderId` update:
     * - we return the `records` list filtered by the current `folderId`.
     */
    useEffect(() => {
        const subRecords = originalRecords.filter(record => record.location.folderId === folderId);
        setRecords(subRecords);
    }, [originalRecords, folderId]);

    /**
     * Any time we receive a new `sort` value:
     * - we sort the current `folders` list according to `sort` value;
     */
    useEffect(() => {
        setFolders(folders => sortTableItems(folders, sort));
    }, [sort]);

    return useMemo<UseAcoListResponse>(
        () => ({
            folders,
            records,
            listTitle,
            isListLoading:
                recordsLoading.INIT ||
                foldersLoading.INIT ||
                recordsLoading.LIST ||
                foldersLoading.LIST,
            isListLoadingMore: recordsLoading.LIST_MORE,
            meta: meta[folderId] || {},
            listItems(params) {
                const { sort: sortInput = [] } = params;
                // We store `sort` param to local state to handle `folders` and future `records` sorting.
                if (sortInput.length > 0) {
                    setSort(validateOrGetDefaultDbSort(sortInput));
                }

                return listRecords({
                    ...params,
                    sort: sortInput,
                    folderId
                });
            }
        }),
        [folders, records, foldersLoading, recordsLoading, meta]
    );
};
