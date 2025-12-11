import React, { useEffect, useMemo } from "react";
import type { DataTableSorting, OnDataTableSortingChange } from "@webiny/admin-ui";
import { Column, ColumnsPresenter, columnsRepositoryFactory } from "./Columns/index.js";
import {
    ColumnsVisibilityDecorator,
    ColumnsVisibilityPresenter,
    ColumnsVisibilityUpdater,
    columnsVisibilityRepositoryFactory
} from "./ColumnVisibility/index.js";
import { ColumnsVisibilityLocalStorageGateway } from "./gateways/index.js";
import { TablePresenter } from "./TablePresenter.js";
import { TableInner } from "./TableInner.js";
import type { TableRow } from "~/types.js";
import { ColumnConfig } from "~/config/table/Column.js";

export interface TableProps<T> {
    columns: ColumnConfig[];
    data: T[];
    loading?: boolean;
    nameColumnId?: string;
    namespace: string;
    onSelectRow?: (rows: T[] | []) => void;
    onSortingChange: OnDataTableSortingChange;
    onToggleRow?: (row: T) => void;
    selected: TableRow[];
    sorting: DataTableSorting;
}

export const Table = <T extends TableRow>({ columns, namespace, ...props }: TableProps<T>) => {
    const columnsRepo = useMemo(() => {
        return columnsRepositoryFactory.getRepository(
            namespace,
            columns.map(column => Column.createFromConfig(column))
        );
    }, [namespace, columns]);

    const visibilityRepo = useMemo(() => {
        const columnsVisibilityLocalStorage = new ColumnsVisibilityLocalStorageGateway(namespace);

        return columnsVisibilityRepositoryFactory.getRepository(
            namespace,
            columnsVisibilityLocalStorage
        );
    }, [namespace]);

    const repo = useMemo(() => {
        return new ColumnsVisibilityDecorator(visibilityRepo, columnsRepo);
    }, [visibilityRepo, columnsRepo]);

    const columnsVisibilityUpdater = new ColumnsVisibilityUpdater(visibilityRepo);

    const columnsPresenter = useMemo(() => new ColumnsPresenter(repo), [repo]);

    const columnsVisibilityPresenter = useMemo(
        () => new ColumnsVisibilityPresenter(columnsPresenter),
        [columnsPresenter]
    );

    const tablePresenter = useMemo<TablePresenter>(() => {
        return new TablePresenter();
    }, []);

    useEffect(() => {
        columnsPresenter.init();
    }, [columnsPresenter]);

    return (
        <TableInner
            {...props}
            columnsPresenter={columnsPresenter}
            columnsVisibilityPresenter={columnsVisibilityPresenter}
            tablePresenter={tablePresenter}
            columnsVisibilityUpdater={columnsVisibilityUpdater}
        />
    );
};
