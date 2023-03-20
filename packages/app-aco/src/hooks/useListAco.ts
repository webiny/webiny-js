import { useContext, useEffect, useMemo, useState } from "react";
import orderBy from "lodash/orderBy";
import unionBy from "lodash/unionBy";
import useDeepCompareEffect from "use-deep-compare-effect";

import { FoldersContext } from "~/contexts/folders";
import { SearchRecordsContext } from "~/contexts/records";
import { FolderItem, ListSort, SearchRecordItem } from "~/types";

interface TableSort {
    fields: string[];
    orders: Array<"asc" | "desc">;
}

export const useListAco = (type: string, originalFolderId?: string) => {
    const folderContext = useContext(FoldersContext);
    const searchContext = useContext(SearchRecordsContext);

    if (!folderContext || !searchContext) {
        throw new Error("useListAco must be used within a ACOProvider");
    }

    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [records, setRecords] = useState<SearchRecordItem[]>([]);
    const [listTitle, setListTitle] = useState<string | undefined>();
    const [dbSort, setDbSort] = useState<ListSort>(Object.create(null));
    const [tableSort, setTableSort] = useState<TableSort>(
        Object.create({ fields: [], orders: [] })
    );

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

    const handleSorting = (sort: ListSort) => {
        const sorting =
            sort && Object.keys(sort).length > 0
                ? sort
                : ({ savedOn: "DESC" } as unknown as ListSort);

        console.log("handleSorting", sorting);
        setDbSort(sorting);

        const fields = [] as TableSort["fields"];
        const orders = [] as TableSort["orders"];
        for (const [field, order] of Object.entries(sorting)) {
            fields.push(field);
            orders.push(order.toLowerCase() as "asc" | "desc");
        }

        setTableSort({ fields, orders });
    };

    // Initial List both records and folders
    useEffect(() => {
        if (!originalFolders[type]) {
            listFolders(type);
        }
        if (type && folderId) {
            listRecords({ type, folderId, sort: dbSort });
        }
    }, [type, folderId]);

    // Sync folders
    useDeepCompareEffect(() => {
        const subFolders = getCurrentFolderList(originalFolders[type], originalFolderId);
        setFolders(subFolders);

        const currentFolder = originalFolders[type]?.find(folder => folder.id === originalFolderId);
        setListTitle(currentFolder?.title || undefined);
    }, [{ ...originalFolders[type] }, folderId]);

    // Sorting
    useEffect(() => {
        setFolders(folders => orderBy(folders, tableSort.fields, tableSort.orders));
    }, [tableSort]);

    // Sync records
    useDeepCompareEffect(() => {
        const subRecords = originalRecords.filter(record => record.location.folderId === folderId);
        setRecords(subRecords);
    }, [{ ...originalRecords }, folderId]);

    return useMemo(
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
            meta: meta[folderId!] || {},
            async listItems(params: { after?: string; limit?: number; sort?: ListSort }) {
                // Store `sort` param for further list records
                if (params.sort) {
                    console.log("qui");
                    handleSorting(params.sort);
                }

                const data = await listRecords({ ...params, type, folderId, sort: dbSort });

                console.log("dbSort", dbSort);
                console.log("tableSort", tableSort);

                setRecords(records =>
                    orderBy(unionBy(data, records, "id"), tableSort.fields, tableSort.orders)
                );
            }
        }),
        [folders, records, foldersLoading, recordsLoading, meta]
    );
};
