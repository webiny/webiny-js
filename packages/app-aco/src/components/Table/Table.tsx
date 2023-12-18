import React, { useEffect, useMemo } from "react";
import { DataTable, DefaultData, OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { observer } from "mobx-react-lite";
import { TablePresenter } from "~/components/Table/TablePresenter";
import { TableRowProvider } from "~/components/Table/useTableRow";
import { useAcoConfig } from "~/config";

export interface TableProps<T> {
    data: T[];
    loading?: boolean;
    nameColumnId?: string;
    namespace: string;
    onSelectRow?: (rows: T[] | []) => void;
    onSortingChange: OnSortingChange;
    onToggleRow?: (row: T) => void;
    selected: DefaultData[];
    sorting: Sorting;
}

export const Table = observer(
    <T extends Record<string, any> & DefaultData>(props: TableProps<T>) => {
        const { table } = useAcoConfig();
        const cellRenderer = (row: T, cell: string | React.ReactElement) => (
            <TableRowProvider row={row}>{cell}</TableRowProvider>
        );

        const presenter = useMemo<TablePresenter<T>>(() => {
            return new TablePresenter<T>(cellRenderer);
        }, []);

        useEffect(() => {
            presenter.load({
                columns: table.columns,
                data: props.data,
                nameColumnId: props.nameColumnId,
                namespace: props.namespace,
                selected: props.selected
            });
        }, [table.columns, props.nameColumnId, props.data, props.selected]);

        return (
            <DataTable
                columns={presenter.vm.columns}
                columnVisibility={presenter.vm.columnVisibility}
                data={props.data}
                initialSorting={presenter.vm.initialSorting}
                isRowSelectable={presenter.isRowSelectable}
                loadingInitial={props.loading}
                onColumnVisibilityChange={presenter.onColumnVisibilityChange}
                onSelectRow={props.onSelectRow}
                onSortingChange={props.onSortingChange}
                onToggleRow={props.onToggleRow}
                selectedRows={presenter.vm.selectedRows}
                sorting={props.sorting}
                stickyRows={1}
            />
        );
    }
);
