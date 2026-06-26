import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import type { OnDataTableSortingChange } from "@webiny/admin-ui";
import {
    DataTable,
    type DataTableColumns,
    type DataTableDefaultData,
    type DataTableSorting
} from "@webiny/admin-ui";
import type { ColumnsPresenter } from "./Columns/index.js";
import { ColumnMapper } from "./Columns/index.js";
import type {
    ColumnsVisibilityPresenter,
    ColumnsVisibilityUpdater
} from "./ColumnVisibility/index.js";
import type { TablePresenter } from "./TablePresenter.js";
import { TableRowProvider } from "../../useTableRow.js";
import type { TableRow } from "../../table.types.js";

export interface TableInnerProps<T extends TableRow> {
    columnsPresenter: ColumnsPresenter;
    columnsVisibilityPresenter: ColumnsVisibilityPresenter;
    columnsVisibilityUpdater: ColumnsVisibilityUpdater;
    data: T[];
    loading?: boolean;
    nameColumnId?: string;
    onSelectRow?: (rows: T[] | []) => void;
    onSortingChange: OnDataTableSortingChange;
    onToggleRow?: (row: T) => void;
    selected: DataTableDefaultData[];
    sorting: DataTableSorting;
    tablePresenter: TablePresenter;
}

export const TableInner = observer(<T extends TableRow>(props: TableInnerProps<T>) => {
    const cellRenderer = useCallback(
        (row: T, cell: string | React.ReactElement): string | number | React.JSX.Element | null => {
            if (typeof cell === "string") {
                return cell;
            }

            return <TableRowProvider row={row}>{cell}</TableRowProvider>;
        },
        []
    );

    const columns = useMemo(() => {
        return props.columnsPresenter.vm.columns.reduce((result, column) => {
            const { nameColumnId = "name" } = props;
            const { name: defaultName } = column;

            // Determine the column name, using the provided `nameColumnId` if the default is 'name'
            const name = defaultName === "name" ? nameColumnId : defaultName;

            result[name as keyof DataTableColumns<T>] = ColumnMapper.toDataTable(
                column,
                cellRenderer
            );

            return result;
        }, {} as DataTableColumns<T>);
    }, [props.columnsPresenter.vm.columns]);

    return (
        <DataTable
            columns={columns}
            columnVisibility={props.columnsVisibilityPresenter.vm.columnsVisibility}
            onColumnVisibilityChange={props.columnsVisibilityUpdater.update}
            data={props.data}
            initialSorting={props.tablePresenter.vm.initialSorting}
            isRowSelectable={row => row.original.$selectable ?? false}
            loading={props.loading}
            onSelectRow={props.onSelectRow}
            onSortingChange={props.onSortingChange}
            onToggleRow={props.onToggleRow}
            selectedRows={props.data.filter(row => props.selected.find(item => row.id === item.id))}
            sorting={props.sorting}
            stickyHeader={true}
        />
    );
});
