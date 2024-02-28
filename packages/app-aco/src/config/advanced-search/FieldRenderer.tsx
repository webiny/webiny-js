import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { FieldType } from "~/components/AdvancedSearch/domain";
import { useInputField } from "~/components/AdvancedSearch/useInputField";

export interface FieldRendererConfig {
    name: string;
    element: React.ReactElement;
    types: FieldType[];
}

export interface FieldRendererProps {
    name: string;
    element: React.ReactElement;
    types: FieldType[];
}

const BaseFieldRenderer = ({ name, types, element }: FieldRendererProps) => {
    const getId = useIdGenerator("advancedSearchFieldRenderer");
    return (
        <Property id="advancedSearch" name={"advancedSearch"}>
            <Property id={getId(name)} name={"fieldRenderers"} array={true}>
                <Property id={getId(name, "name")} name={"name"} value={name} />
                <Property id={getId(name, "element")} name={"element"} value={element} />
                <Property id={getId(name, "types")} name={"types"} value={types} />
            </Property>
        </Property>
    );
};

export const FieldRenderer = Object.assign(BaseFieldRenderer, {
    useInputField,
    FieldType
});
