import { useContext, useEffect, useMemo, useState } from "react";

import useDeepCompareEffect from "use-deep-compare-effect";

import { FoldersContext } from "~/contexts/folders";
import { SearchRecordsContext } from "~/contexts/records";
import { sortTableItems, validateOrGetDefaultDbSort } from "~/sorting";

import { FolderItem, ListDbSort, SearchRecordItem } from "~/types";

export const useAcoList = (type: string, originalFolderId?: string) => {
    const folderContext = useContext(FoldersContext);
    const searchContext = useContext(SearchRecordsContext);

    if (!folderContext || !searchContext) {
        throw new Error("useAcoList must be used within a ACOProvider");
    }

    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [records, setRecords] = useState<SearchRecordItem[]>([]);
    const [listTitle, setListTitle] = useState<string | undefined>();
    const [sort, setSort] = useState<ListDbSort>();

    const { folders: originalFolders, loading: foldersLoading, listFolders } = folderContext;
    const { records: originalRecords, loading: recordsLoading, listRecords, meta } = searchContext;

    const folderId = originalFolderId || "ROOT";

    const getCurrentFolderList = (
        folders: FolderItem[],
        currentFolderId?: string
    ): FolderItem[] | [] => {
        if (!folders) {
            return [];
        }
        if (currentFolderId) {
            return folders.filter(folder => folder.parentId === currentFolderId);
        } else {
            return folders.filter(folder => !folder.parentId);
        }
    };

    const getCurrentRecordList = (
        records: SearchRecordItem[],
        currentFolderId?: string
    ): SearchRecordItem[] | [] => {
        if (!records) {
            return [];
        }

        return records.filter(record => record.location.folderId === currentFolderId);
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
        if (!originalFolders[type]) {
            listFolders(type);
        }

        listRecords({ type, folderId, sort });
    }, [type, folderId]);

    /**
     * Any time we receive a `folders` list update:
     * - we return the list filtered by the current `type` and parent `folderId`, sorted according to the current `sort` value;
     * - we return the current folder name.
     */
    useDeepCompareEffect(() => {
        const subFolders = getCurrentFolderList(originalFolders[type], originalFolderId);
        setFolders(sortTableItems(subFolders, sort));

        const currentFolder = originalFolders[type]?.find(folder => folder.id === originalFolderId);
        setListTitle(currentFolder?.title || undefined);
    }, [{ ...originalFolders[type] }, folderId]);

    /**
     * Any time we receive a `records` list or `folderId` update:
     * - we return the `records` list filtered by the current `folderId`.
     */
    useDeepCompareEffect(() => {
        const subRecords = getCurrentRecordList(originalRecords[type], folderId);
        setRecords(subRecords);
    }, [{ ...originalRecords[type] }, folderId]);

    /**
     * Any time we receive a new `sort` value:
     * - we sort the current `folders` list according to `sort` value;
     */
    useEffect(() => {
        setFolders(folders => sortTableItems(folders, sort));
    }, [sort]);

    return useMemo(
        () => ({
            folders,
            records,
            listTitle,
            isListLoading: Boolean(
                recordsLoading.INIT ||
                    foldersLoading.INIT ||
                    recordsLoading.LIST ||
                    foldersLoading.LIST
            ),
            isListLoadingMore: Boolean(recordsLoading.LIST_MORE),
            meta: meta[folderId] || {},
            listItems(params: { after?: string; limit?: number; sort?: ListDbSort }) {
                // We store `sort` param to local state to handle `folders` and future `records` sorting.
                if (params.sort && Object.values(params.sort).length > 0) {
                    setSort(validateOrGetDefaultDbSort(params.sort));
                }

                return listRecords({ ...params, type, folderId });
            }
        }),
        [folders, records, foldersLoading, recordsLoading, meta]
    );
};
