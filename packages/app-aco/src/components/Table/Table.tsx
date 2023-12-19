import React, { useCallback, useEffect, useMemo } from "react";
import { Columns, DataTable, DefaultData, OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { observer } from "mobx-react-lite";
import { TablePresenter } from "~/components/Table/TablePresenter";
import { TableRowProvider } from "~/components/Table/useTableRow";
import { columnRepositoryFactory, ColumnMapper } from "~/components/Table/domain";
import { useAcoConfig } from "~/config";

import { Column } from "./domain";
import { ColumnPresenter } from "./ColumnPresenter";

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

        const columnRepository = columnRepositoryFactory.getRepository(
            props.namespace,
            table.columns.map(column => Column.createFromConfig(column))
        );

        const presenter = useMemo<TablePresenter<T>>(() => {
            const columnPresenter = new ColumnPresenter(columnRepository);
            return new TablePresenter<T>(columnPresenter);
        }, [columnRepository]);

        useEffect(() => {
            presenter.load({
                data: props.data,
                selected: props.selected
            });
        }, [props.data, props.selected]);

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
            return presenter.vm.columns.reduce((result, column) => {
                const { name: defaultName } = column;

                const name = defaultName === "name" ? props.nameColumnId : defaultName;

                result[name as keyof Columns<T>] = ColumnMapper.toDataTable(column, cellRenderer);

                return result;
            }, {} as Columns<T>);
        }, [presenter.vm.columns]);

        return (
            <DataTable
                columns={columns}
                columnVisibility={presenter.vm.columnVisibility}
                data={props.data}
                initialSorting={presenter.vm.initialSorting}
                isRowSelectable={presenter.isRowSelectable}
                loadingInitial={props.loading}
                onColumnVisibilityChange={presenter.updateColumnVisibility}
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
