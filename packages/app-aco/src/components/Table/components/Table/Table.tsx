import React, { useCallback, useEffect, useMemo } from "react";
import { Columns, DataTable, DefaultData, OnSortingChange, Sorting } from "@webiny/ui/DataTable";
import { observer } from "mobx-react-lite";

import { TableRowProvider } from "~/components/Table/useTableRow";
import { Column, ColumnMapper } from "./Columns";
import { ColumnsVisibilityLocalStorageGateway } from "./gateways";
import { TablePresenter } from "./TablePresenter";
import { useAcoConfig } from "~/config";
import { columnsRepositoryFactory } from "./Columns/ColumnsRepositoryFactory";
import { columnsVisibilityRepositoryFactory } from "./ColumnVisibility/ColumnsVisibilityRepositoryFactory";
import { ColumnsVisibilityDecorator } from "~/components/Table/components/Table/ColumnVisibility/ColumnsVisibilityDecorator";
import { ColumnsVisibilityUpdater } from "./ColumnVisibility/ColumnsVisibilityUpdater";
import { ColumnsPresenter } from "./Columns/ColumnsPresenter";
import { ColumnsVisibilityPresenter } from "~/components/Table/components/Table/ColumnVisibility/ColumnsVisibilityPresenter";

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

        const columnsRepo = useMemo(() => {
            return columnsRepositoryFactory.getRepository(
                props.namespace,
                table.columns.map(column => Column.createFromConfig(column))
            );
        }, [props.namespace, table.columns]);

        const visibilityRepo = useMemo(() => {
            const columnsVisibilityLocalStorage = new ColumnsVisibilityLocalStorageGateway(
                props.namespace
            );

            return columnsVisibilityRepositoryFactory.getRepository(
                props.namespace,
                columnsVisibilityLocalStorage
            );
        }, [props.namespace]);

        const repo = useMemo(() => {
            return new ColumnsVisibilityDecorator(visibilityRepo, columnsRepo);
        }, [visibilityRepo, columnsRepo]);

        const columnsVisibilityUpdater = new ColumnsVisibilityUpdater(visibilityRepo);

        const columnsPresenter = useMemo(() => new ColumnsPresenter(repo), [repo]);

        const columnsVisibilityPresenter = useMemo(
            () => new ColumnsVisibilityPresenter(columnsPresenter),
            [columnsPresenter]
        );

        const presenter = useMemo<TablePresenter>(() => {
            return new TablePresenter();
        }, []);

        const cellRenderer = useCallback(
            (row: T, cell: string | React.ReactElement): string | number | JSX.Element | null => {
                if (typeof cell === "string") {
                    return cell;
                }

                return <TableRowProvider row={row}>{cell}</TableRowProvider>;
            },
            []
        );

        useEffect(() => {
            columnsPresenter.init();
        }, [columnsPresenter]);

        const columns = useMemo(() => {
            return columnsPresenter.vm.columns.reduce((result, column) => {
                const { name: defaultName } = column;

                const name = defaultName === "name" ? props.nameColumnId : defaultName;

                result[name as keyof Columns<T>] = ColumnMapper.toDataTable(column, cellRenderer);

                return result;
            }, {} as Columns<T>);
        }, [columnsPresenter.vm.columns]);

        return (
            <DataTable
                columns={columns}
                columnVisibility={columnsVisibilityPresenter.vm.columnsVisibility}
                onColumnVisibilityChange={columnsVisibilityUpdater.update}
                data={props.data}
                initialSorting={presenter.vm.initialSorting}
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
