import React from "react";
import {
    Columns,
    ColumnVisibility as IColumnVisibility,
    DefaultData,
    OnColumnVisibilityChange,
    Sorting,
    TableRow
} from "@webiny/ui/DataTable";
import { makeAutoObservable } from "mobx";
import { ColumnConfig } from "~/config/table/Column";
import { ColumnVisibility } from "~/components/Table/ColumnVisibility";

export interface TablePresenterViewModel<T> {
    columns: Columns<T>;
    selectedRows: T[];
    columnVisibility: IColumnVisibility;
    initialSorting: Sorting;
}

interface LoadParamsInterface<T> {
    columns: ColumnConfig[];
    data: T[];
    nameColumnId?: string;
    namespace: string;
    selected: DefaultData[];
}

export interface ITablePresenter<T extends DefaultData> {
    load: (configs: LoadParamsInterface<T>) => void;
    onColumnVisibilityChange: OnColumnVisibilityChange;
    isRowSelectable: (row: TableRow<T>) => boolean;
    get vm(): TablePresenterViewModel<T>;
}

export class TablePresenter<T extends DefaultData> implements ITablePresenter<T> {
    private columnVisibility: ColumnVisibility;
    private columnConfigs: ColumnConfig[] | undefined;
    private data: T[];
    private selected: DefaultData[];
    private nameColumnId: string | undefined;
    private cellRenderer: (
        item: T,
        cell: string | React.ReactElement
    ) => string | number | JSX.Element | null;

    constructor(
        cellRenderer: (
            item: T,
            cell: string | React.ReactElement
        ) => string | number | JSX.Element | null
    ) {
        this.cellRenderer = cellRenderer;
        this.data = [];
        this.selected = [];
        this.columnConfigs = undefined;
        this.nameColumnId = undefined;
        this.columnVisibility = new ColumnVisibility();

        makeAutoObservable(this);
    }

    load(params: LoadParamsInterface<T>) {
        this.columnConfigs = params.columns;
        this.data = params.data;
        this.selected = params.selected;
        this.nameColumnId = params.nameColumnId;
        this.columnVisibility.load(params.namespace, params.columns);
    }

    get vm() {
        return {
            columns: this.getColumns(),
            selectedRows: this.getSelectedRows(),
            columnVisibility: this.columnVisibility.getState(),
            initialSorting: this.getInitialSorting()
        };
    }

    public isRowSelectable(row: TableRow<T>) {
        return row.original.$selectable || false;
    }

    public onColumnVisibilityChange: OnColumnVisibilityChange = updaterOrValue =>
        this.columnVisibility.onChange(updaterOrValue);

    private getInitialSorting = () => {
        return [
            {
                id: "savedOn",
                desc: true
            }
        ];
    };

    private getColumns(): Columns<T> {
        if (!this.columnConfigs || !this.cellRenderer) {
            return {};
        }

        return this.columnConfigs.reduce((columns, config) => {
            const {
                name: defaultName,
                cell,
                header,
                size,
                sortable,
                resizable,
                className,
                hidable
            } = config;

            const name = defaultName === "name" ? this.nameColumnId : defaultName;

            columns[name as keyof Columns<T>] = {
                header,
                enableHiding: hidable,
                enableSorting: sortable,
                enableResizing: resizable,
                className,
                ...(size && { size }),
                ...(cell && { cell: (row: T) => this.cellRenderer(row, cell) })
            };

            return columns;
        }, {} as Columns<T>);
    }

    private getSelectedRows() {
        return this.data.filter(row => this.selected.find(item => row.id === item.id));
    }
}
