import React, { ReactElement } from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { useTableCell } from "~/components/Table/useTableCell";
import { FolderTableItem, BaseTableItem } from "~/types";

export interface ColumnConfig {
    cell: string | ReactElement;
    className: string;
    header: string | ReactElement;
    hidable: boolean;
    name: string;
    resizable: boolean;
    size: number;
    sortable: boolean;
}

export interface ColumnProps {
    after?: string;
    before?: string;
    cell?: string | ReactElement;
    className?: string;
    header?: string | ReactElement;
    hidable?: boolean;
    name: string;
    remove?: boolean;
    resizable?: boolean;
    size?: number;
    sortable?: boolean;
}

const BaseColumn: React.FC<ColumnProps> = ({
    after = undefined,
    before = undefined,
    cell,
    className = undefined,
    header = undefined,
    hidable = true,
    name,
    remove = false,
    resizable = true,
    size = 200,
    sortable = false
}) => {
    const getId = useIdGenerator("tableColumn");

    const placeAfter = after !== undefined ? getId(after) : undefined;
    const placeBefore = before !== undefined ? getId(before) : undefined;

    return (
        <Property id="table" name={"table"}>
            <Property
                id={getId(name)}
                name={"columns"}
                remove={remove}
                array={true}
                before={placeBefore}
                after={placeAfter}
            >
                <Property id={getId(name, "name")} name={"name"} value={name} />
                <Property id={getId(name, "sortable")} name={"sortable"} value={sortable} />
                <Property id={getId(name, "resizable")} name={"resizable"} value={resizable} />
                <Property id={getId(name, "hidable")} name={"hidable"} value={hidable} />
                <Property id={getId(name, "size")} name={"size"} value={size} />
                {header ? (
                    <Property id={getId(name, "header")} name={"header"} value={header} />
                ) : null}
                {cell ? <Property id={getId(name, "element")} name={"cell"} value={cell} /> : null}
                {className ? (
                    <Property id={getId(name, "className")} name={"className"} value={className} />
                ) : null}
            </Property>
        </Property>
    );
};

const isFolderItem = (item: BaseTableItem): item is FolderTableItem => {
    return item.$type === "FOLDER";
};

export const Column = Object.assign(BaseColumn, { isFolderItem, useTableCell });
