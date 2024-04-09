import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Columns, DataTable, DefaultData, OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { ColumnMapper, ColumnsPresenter } from "./Columns";
import { ColumnsVisibilityPresenter, ColumnsVisibilityUpdater } from "./ColumnVisibility";
import { TablePresenter } from "./TablePresenter";
import { TableRowProvider } from "~/components";

export interface TableInnerProps<T> {
    columnsPresenter: ColumnsPresenter;
    columnsVisibilityPresenter: ColumnsVisibilityPresenter;
    columnsVisibilityUpdater: ColumnsVisibilityUpdater;
    data: T[];
    loading?: boolean;
    nameColumnId?: string;
    onSelectRow?: (rows: T[] | []) => void;
    onSortingChange: OnSortingChange;
    onToggleRow?: (row: T) => void;
    selected: DefaultData[];
    sorting: Sorting;
    tablePresenter: TablePresenter;
}

export const TableInner = observer(
    <T extends Record<string, any> & DefaultData>(props: TableInnerProps<T>) => {
        const cellRenderer = useCallback(
            (row: T, cell: string | React.ReactElement): string | number | JSX.Element | null => {
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

                result[name as keyof Columns<T>] = ColumnMapper.toDataTable(column, cellRenderer);

                return result;
            }, {} as Columns<T>);
        }, [props.columnsPresenter.vm.columns]);

        return (
            <DataTable
                columns={columns}
                columnVisibility={props.columnsVisibilityPresenter.vm.columnsVisibility}
                onColumnVisibilityChange={props.columnsVisibilityUpdater.update}
                data={props.data}
                initialSorting={props.tablePresenter.vm.initialSorting}
                isRowSelectable={row => row.original.$selectable ?? false}
                loadingInitial={props.loading}
                onSelectRow={props.onSelectRow}
                onSortingChange={props.onSortingChange}
                onToggleRow={props.onToggleRow}
                selectedRows={props.data.filter(row =>
                    props.selected.find(item => row.id === item.id)
                )}
                sorting={props.sorting}
                stickyRows={1}
            />
        );
    }
);
