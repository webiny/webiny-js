import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface SortingConfig {
    field: string;
    order: "asc" | "desc";
}

export interface SortingProps {
    name: string;
    field: string;
    order?: "asc" | "desc";
}

export const Sorting = ({ name, field, order = "desc" }: SortingProps) => {
    const getId = useIdGenerator("tableSorting");

    return (
        <Property id="table" name={"table"}>
            <Property id={getId(name)} name={"sorting"} array={true}>
                <Property id={getId(name, "name")} name={"name"} value={name} />
                <Property id={getId(name, "field")} name={"field"} value={field} />
                <Property id={getId(name, "order")} name={"order"} value={order} />
            </Property>
        </Property>
    );
};
