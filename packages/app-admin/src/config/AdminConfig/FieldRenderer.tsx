import React from "react";
import { ConnectToProperties, Property, useIdGenerator } from "@webiny/react-properties";
import type { FieldRendererComponent } from "../../features/formModel/FormView.js";

export interface FieldRendererConfig {
    name: string;
    component: FieldRendererComponent;
}

export interface FieldRendererProps {
    name: string;
    component: FieldRendererComponent;
}

export const FieldRenderer = ({ name, component }: FieldRendererProps) => {
    const getId = useIdGenerator("FormFieldRenderer");

    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property
                id={getId(name)}
                name={"fieldRenderers"}
                array={true}
                value={{ name, component }}
            />
        </ConnectToProperties>
    );
};
