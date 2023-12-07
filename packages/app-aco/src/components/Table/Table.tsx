import React, { useCallback, useMemo } from "react";
import { Columns, DataTable, DefaultData, OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { useAcoConfig } from "~/config";
import { TableCellProvider } from "~/components";

export interface TableProps<T> {
    data: T[];
    loading?: boolean;
    nameColumnId?: string;
    onSelectRow?: (rows: T[] | []) => void;
    onSortingChange: OnSortingChange;
    onToggleRow?: (row: T) => void;
    selected: DefaultData[];
    sorting: Sorting;
}

export const Table = <T extends Record<string, any> & DefaultData>({
    data,
    loading,
    nameColumnId = "name",
    onSelectRow,
    onSortingChange,
    onToggleRow,
    selected,
    sorting
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

    const isRowSelectable = useCallback(row => {
        return row.original.$selectable;
    }, []);

    const selectedRows = useMemo(() => {
        return data.filter(row => selected.find(item => row.id === item.id));
    }, [data, selected]);

    const initialSorting = [
        {
            id: "savedOn",
            desc: true
        }
    ];

    return (
        <DataTable
            columns={columns}
            data={data}
            initialSorting={initialSorting}
            isRowSelectable={isRowSelectable}
            loadingInitial={loading}
            onSelectRow={onSelectRow}
            onSortingChange={onSortingChange}
            onToggleRow={onToggleRow}
            selectedRows={selectedRows}
            sorting={sorting}
            stickyRows={1}
        />
    );
};
