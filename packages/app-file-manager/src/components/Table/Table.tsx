import React, { forwardRef, useMemo } from "react";
import { FolderItem, FolderTableItem } from "@webiny/app-aco/types";
import { Table as AcoTable } from "@webiny/app-aco";

import { OnSortingChange, Sorting } from "@webiny/ui/DataTable";

import { FileItem } from "@webiny/app-admin/types";
import { Settings, TableItem, FileTableItem } from "~/types";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider";

export interface TableProps {
    selectedRecords: FileItem[];
    loading?: boolean;
    onRecordClick: (id: string) => void;
    onFolderClick: (id: string) => void;
    onSelectRow: ((rows: TableItem[] | []) => void) | undefined;
    onToggleRow: ((row: TableItem) => void) | undefined;
    sorting: Sorting;
    onSortingChange: OnSortingChange;
    settings?: Settings;
}

const createRecordsData = (items: FileItem[]): FileTableItem[] => {
    return items.map(item => {
        return {
            $type: "RECORD",
            $selectable: true, // Files a.k.a. records are always selectable to perform bulk actions
            ...item
        };
    });
};

const createFoldersData = (items: FolderItem[]): FolderTableItem[] => {
    return items.map(item => ({
        $type: "FOLDER",
        $selectable: false,
        ...item
    }));
};

export const Table = forwardRef<HTMLDivElement, TableProps>((props, ref) => {
    const { selectedRecords, onSelectRow, onToggleRow, sorting, onSortingChange } = props;

    const view = useFileManagerView();

    const data = useMemo<TableItem[]>(() => {
        return [...createFoldersData(view.folders), ...createRecordsData(view.files)];
    }, [view.folders, view.files]);

    return (
        <div ref={ref}>
            <AcoTable<TableItem>
                data={data}
                loading={view.isListLoading}
                onSelectRow={onSelectRow}
                onToggleRow={onToggleRow}
                sorting={sorting}
                onSortingChange={onSortingChange}
                selectedRows={createRecordsData(selectedRecords)}
            />
        </div>
    );
});

Table.displayName = "Table";

// return (
//     <div ref={ref}>
//         <DataTable<TableItem>
//             columns={columns} REMOVED
//             data={data} ADDED
//             loadingInitial={loading} ADDED
//             stickyRows={1} REMOVED
//             onSelectRow={onSelectRow}
//             onToggleRow={onToggleRow}
//             isRowSelectable={row => row.original.$selectable} REMOVED
//             sorting={sorting}
//             initialSorting={[
//                 {
//                     id: "createdOn",
//                     desc: true
//                 }
//             ]}
//             onSortingChange={onSortingChange}
//             selectedRows={createRecordsData(selectedRecords)}
//         />
//     </div>
// );
