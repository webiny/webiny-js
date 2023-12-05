import React, { forwardRef, useMemo } from "react";
import { useAcoConfig } from "@webiny/app-aco";
import { Columns, DataTable, OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { TableCellProvider, useModel } from "~/admin/hooks";
import { CmsContentEntry } from "@webiny/app-headless-cms-common/types";
import { FolderTableItem } from "@webiny/app-aco/types";
import { EntryTableItem, TableItem } from "~/types";

export interface TableProps {
    folders: FolderTableItem[];
    loading?: boolean;
    onSelectRow: (rows: TableItem[] | []) => void;
    onSortingChange: OnSortingChange;
    records: EntryTableItem[];
    selectedRows: CmsContentEntry[];
    sorting: Sorting;
}

export const Table = forwardRef<HTMLDivElement, TableProps>((props, ref) => {
    const { folders, records, loading, sorting, onSortingChange, selectedRows, onSelectRow } =
        props;
    const { folder: folderConfig, table } = useAcoConfig();
    const { model } = useModel();

    const data = useMemo<TableItem[]>(() => {
        return (folders as TableItem[]).concat(records as TableItem[]);
    }, [folders, records]);

    const columns: Columns<TableItem> = useMemo(() => {
        const columnName = model.titleFieldId || "id";

        return table.columns.reduce((obj, item) => {
            const { name: defaultName, cell, header, size, sortable, resizable, className } = item;

            const name = defaultName === "name" ? columnName : defaultName;
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
                isRowSelectable={row => row.original.$selectable}
                loadingInitial={loading}
                stickyRows={1}
                sorting={sorting}
                initialSorting={[
                    {
                        id: "createdOn",
                        desc: true
                    }
                ]}
                onSelectRow={onSelectRow}
                onSortingChange={onSortingChange}
                selectedRows={data.filter(record => selectedRows.find(row => row.id === record.id))}
            />
        </div>
    );
});

Table.displayName = "Table";
