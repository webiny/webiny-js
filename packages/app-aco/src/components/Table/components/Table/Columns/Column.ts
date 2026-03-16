import type { ReactElement } from "react";
import type { ColumnConfig } from "~/config/table/Column.js";

export interface ColumnDTO {
    cell: string | ReactElement;
    className: string;
    header: string | number | React.JSX.Element;
    hideable: boolean;
    name: string;
    path?: string;
    resizable: boolean;
    size: number;
    sortable: boolean;
    visible: boolean;
}

export class Column {
    public cell: string | ReactElement;
    public className: string;
    public header: string | number | React.JSX.Element;
    public hideable: boolean;
    public name: string;
    public path?: string;
    public resizable: boolean;
    public size: number;
    public sortable: boolean;
    public visible: boolean;

    static createFromConfig(config: ColumnConfig) {
        return new Column(config);
    }

    protected constructor(data: {
        name: string;
        header: string | number | React.JSX.Element;
        cell: string | ReactElement;
        size?: number;
        className?: string;
        hideable?: boolean;
        path?: string;
        sortable?: boolean;
        resizable?: boolean;
        visible?: boolean;
    }) {
        this.name = data.name;
        this.header = data.header;
        this.cell = data.cell;
        this.size = data.size || 100;
        this.className = data.className || "";
        this.hideable = data.hideable ?? true;
        this.path = data.path || "";
        this.sortable = data.sortable ?? false;
        this.resizable = data.resizable ?? true;
        this.visible = data.visible ?? true;
    }
}
