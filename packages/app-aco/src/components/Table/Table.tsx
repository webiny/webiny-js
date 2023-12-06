import React, { useCallback, useMemo } from "react";
import { Columns, DataTable, DefaultData, OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { useAcoConfig } from "~/config";
import { TableCellProvider } from "~/components";

export interface TableProps<T> {
    data: T[];
    loading?: boolean;
    nameColumnId?: string;
    onSelectRow: (rows: T[] | []) => void;
    onSortingChange: OnSortingChange;
    selectedRows: T[];
    sorting: Sorting;
}

export const Table = <T extends Record<string, any> & DefaultData>({
    data,
    loading,
    nameColumnId = "name",
    onSortingChange,
    sorting,
    onSelectRow,
    selectedRows: defaultSelectedRows
}: TableProps<T>) => {
    const { folder: folderConfig, table } = useAcoConfig();

    const columns: Columns<T> = useMemo(() => {
        return table.columns.reduce((obj, item) => {
            const { name: defaultName, cell, header, size, sortable, resizable, className } = item;

            const name = defaultName === "name" ? nameColumnId : defaultName;
            const cellRenderer = (item: T) => (
                <TableCellProvider item={item}>{cell}</TableCellProvider>
            );

            obj[name as keyof Columns<T>] = {
                header,
                enableSorting: sortable,
                enableResizing: resizable,
                size,
                className,
                ...(cell && { cell: cellRenderer })
            };

            return obj;
        }, {} as Columns<T>);
    }, [folderConfig, table]);

    const selectedRows = useMemo(() => {
        return data.filter(record => defaultSelectedRows.find(row => row.id === record.id));
    }, [data, defaultSelectedRows]);

    const isRowSelectable = useCallback(row => {
        return row.original.$selectable;
    }, []);

    return (
        <DataTable
            columns={columns}
            stickyRows={1}
            isRowSelectable={isRowSelectable}
            selectedRows={selectedRows}
            sorting={sorting}
            data={data}
            loadingInitial={loading}
            onSelectRow={onSelectRow}
            onSortingChange={onSortingChange}
            initialSorting={[
                {
                    id: "savedOn",
                    desc: true
                }
            ]}
        />
    );
};
