import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface BulkEditFieldConfig {
    name: string;
    element: React.ReactElement;
}

export interface BulkEditFieldProps {
    name: string;
    element: React.ReactElement;
}

export const BulkEditField = ({ name, element }: BulkEditFieldProps) => {
    const getId = useIdGenerator("bulkEditField");

    return (
        <Property id="browser" name={"browser"}>
            <Property id={getId(name)} name={"bulkEditFields"} array={true}>
                <Property id={getId(name, "name")} name={"name"} value={name} />
                <Property id={getId(name, "element")} name={"element"} value={element} />
            </Property>
        </Property>
    );
};
