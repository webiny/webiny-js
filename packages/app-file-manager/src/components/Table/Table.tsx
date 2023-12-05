import React, { forwardRef, useMemo } from "react";
import { useAcoConfig } from "@webiny/app-aco";
import { FolderItem, FolderTableItem } from "@webiny/app-aco/types";
import { Columns, DataTable, OnSortingChange, Sorting } from "@webiny/ui/DataTable";

import { TableCellProvider } from "~/hooks/useTableCell";

import { FileItem } from "@webiny/app-admin/types";
import { Settings, TableItem, FileTableItem } from "~/types";

export interface TableProps {
    records: FileItem[];
    folders: FolderItem[];
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
    const {
        folders,
        records,
        selectedRecords,
        onSelectRow,
        onToggleRow,
        loading,
        sorting,
        onSortingChange
    } = props;

    const { folder: folderConfig, table } = useAcoConfig();

    const data = useMemo<TableItem[]>(() => {
        return [...createFoldersData(folders), ...createRecordsData(records)];
    }, [folders, records]);

    const columns: Columns<TableItem> = useMemo(() => {
        return table.columns.reduce((obj, item) => {
            const { name, cell, header, size, sortable, resizable, className } = item;

            const cellRenderer = (item: TableItem) => (
                <TableCellProvider item={item}>{cell}</TableCellProvider>
            );

            obj[name as keyof Columns<TableItem>] = {
                header,
                enableSorting: sortable,
                enableResizing: resizable,
                size,
                className,
                ...(cell && { cell: cellRenderer })
            };

            return obj;
        }, {} as Columns<TableItem>);
    }, [folderConfig, table]);

    return (
        <div ref={ref}>
            <DataTable<TableItem>
                columns={columns}
                data={data}
                loadingInitial={loading}
                stickyRows={1}
                onSelectRow={onSelectRow}
                onToggleRow={onToggleRow}
                isRowSelectable={row => row.original.$selectable}
                sorting={sorting}
                initialSorting={[
                    {
                        id: "createdOn",
                        desc: true
                    }
                ]}
                onSortingChange={onSortingChange}
                selectedRows={createRecordsData(selectedRecords)}
            />
        </div>
    );
});

Table.displayName = "Table";
