import React from "react";
import { Row, SortingState } from "@tanstack/react-table";
import {
    Columns,
    ColumnVisibility,
    DefaultData,
    OnColumnVisibilityChange
} from "@webiny/ui/DataTable";
import { makeAutoObservable } from "mobx";
import store from "store";
import { ColumnConfig } from "~/config/table/Column";

export interface TablePresenterViewModel<T> {
    columns: Columns<T>;
    selectedRows: T[];
    columnVisibility: ColumnVisibility;
}

interface LoadConfigInterface<T> {
    columns: ColumnConfig[];
    data: T[];
    nameColumnId?: string;
    namespace: string;
    selected: DefaultData[];
}

export interface ITablePresenter<T extends DefaultData> {
    load: (configs: LoadConfigInterface<T>) => void;
    onColumnVisibilityChange: OnColumnVisibilityChange;
    isRowSelectable: (row: Row<T>) => boolean;
    getInitialSorting: () => SortingState;
    get vm(): TablePresenterViewModel<T>;
}

export class TablePresenter<T extends DefaultData> implements ITablePresenter<T> {
    private storageKey: string;
    private columnConfigs: ColumnConfig[] | undefined;
    private data: T[];
    private selected: DefaultData[];
    private nameColumnId: string | undefined;
    private cellRenderer: (
        item: T,
        cell: string | React.ReactElement
    ) => string | number | JSX.Element | null;
    private columnVisibility: ColumnVisibility;

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
        this.storageKey = "";
        this.columnVisibility = {};

        makeAutoObservable(this);
    }

    load(config: LoadConfigInterface<T>) {
        this.columnConfigs = config.columns;
        this.data = config.data;
        this.selected = config.selected;
        this.nameColumnId = config.nameColumnId;
        this.storageKey = `webiny_column_visibility_${config.namespace}`;
        this.columnVisibility = this.getDefaultColumnVisibility();
    }

    get vm() {
        return {
            columns: this.getColumns(),
            selectedRows: this.getSelectedRows(),
            columnVisibility: this.getColumnVisibility()
        };
    }

    public isRowSelectable(row: Row<T>) {
        return row.original.$selectable || false;
    }

    public getInitialSorting = () => {
        return [
            {
                id: "savedOn",
                desc: true
            }
        ];
    };

    public onColumnVisibilityChange: OnColumnVisibilityChange = updaterOrValue => {
        if (typeof updaterOrValue === "function") {
            this.columnVisibility = updaterOrValue(this.columnVisibility);
        }

        this.columnVisibility = {
            ...this.columnVisibility,
            ...updaterOrValue
        };

        this.setColumnVisibilityToStorage(this.columnVisibility);
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
                size,
                className,
                ...(cell && { cell: (row: T) => this.cellRenderer(row, cell) })
            };

            return columns;
        }, {} as Columns<T>);
    }

    private getSelectedRows() {
        return this.data.filter(row => this.selected.find(item => row.id === item.id));
    }

    private getColumnVisibility() {
        return this.columnVisibility;
    }

    private getDefaultColumnVisibility() {
        if (!this.columnConfigs) {
            return {};
        }

        const columnVisibilityFormStorage = this.getColumnVisibilityFromStorage();

        if (columnVisibilityFormStorage) {
            return columnVisibilityFormStorage;
        }

        return this.columnConfigs.reduce((columnVisibility, config) => {
            const { name, visible } = config;

            columnVisibility[name] = visible;

            return columnVisibility;
        }, {} as ColumnVisibility);
    }

    private getColumnVisibilityFromStorage() {
        const value = store.get(this.storageKey);
        console.log("store", value);

        return value;
    }

    private setColumnVisibilityToStorage(value: ColumnVisibility) {
        store.set(this.storageKey, value);
    }
}
