import React, { ReactElement } from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { FolderTableItem, BaseTableItem } from "~/types";

export interface ColumnConfig {
    name: string;
    header: string | ReactElement;
    cell: string | ReactElement;
    enableSorting: boolean;
    enableResizing: boolean;
    size: number;
    className: string;
}

export interface ColumnProps {
    name: string;
    header?: string | ReactElement;
    cell?: string | ReactElement;
    enableSorting?: boolean;
    enableResizing?: boolean;
    size?: number;
    className?: string;
    remove?: boolean;
    before?: string;
    after?: string;
}

export const BaseColumn: React.FC<ColumnProps> = ({
    name,
    after = undefined,
    before = undefined,
    remove = false,
    cell,
    header = undefined,
    enableSorting = false,
    enableResizing = true,
    size = 200,
    className = undefined
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
                {header ? (
                    <Property id={getId(name, "header")} name={"header"} value={header} />
                ) : null}
                {cell ? <Property id={getId(name, "element")} name={"cell"} value={cell} /> : null}
                <Property
                    id={getId(name, "enableSorting")}
                    name={"enableSorting"}
                    value={enableSorting}
                />
                <Property
                    id={getId(name, "enableResizing")}
                    name={"enableResizing"}
                    value={enableResizing}
                />
                <Property id={getId(name, "size")} name={"size"} value={size} />
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

export const Column = Object.assign(BaseColumn, { isFolderItem });
