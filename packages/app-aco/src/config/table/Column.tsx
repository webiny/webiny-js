import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface ColumnConfig {
    name: string;
    element: React.ReactElement;
}

export interface ColumnProps {
    name: string;
    element?: React.ReactElement;
    remove?: boolean;
    before?: string;
    after?: string;
}

export const BaseColumn: React.FC<ColumnProps> = ({
    name,
    after = undefined,
    before = undefined,
    remove = false,
    element
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
                {element ? (
                    <Property id={getId(name, "element")} name={"element"} value={element} />
                ) : null}
            </Property>
        </Property>
    );
};

export const Column = Object.assign(BaseColumn, {});
