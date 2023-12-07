import React, { forwardRef, useMemo } from "react";
import { FolderItem, FolderTableItem } from "@webiny/app-aco/types";
import { Table as AcoTable } from "@webiny/app-aco";

import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider";

import { OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { FileItem } from "@webiny/app-admin/types";
import { TableItem, FileTableItem } from "~/types";

export interface TableProps {
    onSelectRow: ((rows: TableItem[] | []) => void) | undefined;
    onToggleRow: ((row: TableItem) => void) | undefined;
    sorting: Sorting;
    onSortingChange: OnSortingChange;
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
    const view = useFileManagerView();

    const data = useMemo<TableItem[]>(() => {
        return [...createFoldersData(view.folders), ...createRecordsData(view.files)];
    }, [view.folders, view.files]);

    return (
        <div ref={ref}>
            <AcoTable<TableItem>
                data={data}
                loading={view.isListLoading}
                onSelectRow={props.onSelectRow}
                onToggleRow={props.onToggleRow}
                sorting={props.sorting}
                onSortingChange={props.onSortingChange}
                selected={view.selected}
            />
        </div>
    );
});

Table.displayName = "Table";
