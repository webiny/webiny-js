import React, { ReactElement } from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { createUseTableRow } from "~/components/Table/useTableRow";
import { FolderTableItem, BaseTableItem } from "~/types";

export interface ColumnConfig {
    cell: string | ReactElement;
    className: string;
    header: string | ReactElement;
    hideable: boolean;
    name: string;
    resizable: boolean;
    size: number;
    sortable: boolean;
    visible: boolean;
}

export interface ColumnProps {
    after?: string;
    before?: string;
    cell?: string | ReactElement;
    className?: string;
    header?: string | ReactElement;
    hideable?: boolean;
    name: string;
    remove?: boolean;
    resizable?: boolean;
    size?: number;
    sortable?: boolean;
    visible?: boolean;
}

const BaseColumn: React.FC<ColumnProps> = ({
    after = undefined,
    before = undefined,
    cell,
    className = undefined,
    header = undefined,
    hideable = true,
    name,
    remove = false,
    resizable = true,
    size = 100,
    sortable = false,
    visible = true
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
                <Property id={getId(name, "hideable")} name={"hideable"} value={hideable} />
                <Property id={getId(name, "size")} name={"size"} value={size} />
                <Property id={getId(name, "visible")} name={"visible"} value={visible} />
                {header ? (
                    <Property id={getId(name, "header")} name={"header"} value={header} />
                ) : null}
                {cell ? <Property id={getId(name, "cell")} name={"cell"} value={cell} /> : null}
                {className ? (
                    <Property id={getId(name, "className")} name={"className"} value={className} />
                ) : null}
            </Property>
        </Property>
    );
};

const isFolderRow = (row: BaseTableItem): row is FolderTableItem => {
    return row.$type === "FOLDER";
};

export const Column = Object.assign(BaseColumn, { isFolderRow, createUseTableRow });
