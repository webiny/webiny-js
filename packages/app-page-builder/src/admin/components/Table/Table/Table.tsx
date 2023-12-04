import React, { forwardRef, useMemo } from "react";
import { useAcoConfig } from "@webiny/app-aco";
import { FolderItem, FolderTableItem, SearchRecordItem } from "@webiny/app-aco/types";
import { Columns, DataTable, OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { PbPageDataItem, PbPageTableItem, TableItem } from "~/types";
import { TableCellProvider } from "~/admin/hooks/useTableCell";

export interface TableProps {
    records: SearchRecordItem<PbPageDataItem>[];
    folders: FolderItem[];
    loading?: boolean;
    onSelectRow: (rows: TableItem[] | []) => void;
    selectedRows: SearchRecordItem<PbPageDataItem>[];
    sorting: Sorting;
    onSortingChange: OnSortingChange;
}

const createRecordsData = (items: SearchRecordItem<PbPageDataItem>[]): PbPageTableItem[] => {
    return items.map(item => {
        return {
            $type: "RECORD",
            $selectable: true,
            ...item
        };
    });
};

const createFoldersData = (items: FolderItem[]): FolderTableItem[] => {
    return items.map(item => {
        return {
            $type: "FOLDER",
            $selectable: false,
            ...item
        };
    });
};

export const Table = forwardRef<HTMLDivElement, TableProps>((props, ref) => {
    const { folders, records, loading, onSelectRow, sorting, onSortingChange, selectedRows } =
        props;

    const { folder: folderConfig, table } = useAcoConfig();

    const data = useMemo<TableItem[]>(() => {
        return [...createFoldersData(folders), ...createRecordsData(records)];
    }, [folders, records]);

    const columns: Columns<TableItem> = useMemo(() => {
        return table.columns.reduce((obj, item) => {
            const { name, cell, header, size, enableSorting, enableResizing, className } = item;

            const cellRenderer = (item: TableItem) => (
                <TableCellProvider item={item}>{cell}</TableCellProvider>
            );

            obj[name as keyof Columns<TableItem>] = {
                header,
                enableSorting,
                enableResizing,
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
                sorting={sorting}
                selectedRows={data.filter(record =>
                    selectedRows.find(row => row.data.pid === record.id)
                )}
                isRowSelectable={row => row.original.$selectable}
                onSortingChange={onSortingChange}
                initialSorting={[
                    {
                        id: "createdOn",
                        desc: true
                    }
                ]}
            />
        </div>
    );
});

Table.displayName = "Table";
