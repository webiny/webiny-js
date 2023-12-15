import { makeAutoObservable } from "mobx";
import { LocalStorage } from "~/components/Table/LocalStorage";
import {
    ColumnVisibility as IColumnVisibility,
    OnColumnVisibilityChange
} from "@webiny/ui/DataTable";
import { ColumnConfig } from "~/config/table/Column";

export class ColumnVisibility {
    private state: IColumnVisibility;
    private storage: LocalStorage<IColumnVisibility> | undefined;

    constructor() {
        this.state = {};
        makeAutoObservable(this);
    }

    public load(namespace: string, columnConfigs: ColumnConfig[]) {
        this.storage = new LocalStorage(`webiny_column_visibility_${namespace}`);
        this.state = this.getDefault(columnConfigs);
    }

    public onChange: OnColumnVisibilityChange = updaterOrValue => {
        if (!this.state) {
            return;
        }

        if (typeof updaterOrValue === "function") {
            this.state = updaterOrValue(this.state);
        }

        this.state = {
            ...this.state,
            ...updaterOrValue
        };

        this.storage?.setToStorage(this.state);
    };

    public getState() {
        return this.state;
    }

    private getDefault(configs: ColumnConfig[]) {
        if (!configs) {
            return {};
        }

        const fromStorage = this.storage?.getFromStorage();

        if (fromStorage) {
            return fromStorage;
        }

        return configs.reduce((columnVisibility, config) => {
            const { name, visible } = config;

            columnVisibility[name] = visible;

            return columnVisibility;
        }, {} as IColumnVisibility);
    }
}
