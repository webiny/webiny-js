import React from "react";
import { ConnectToProperties, Property, useIdGenerator } from "@webiny/react-properties";

export interface LayoutRendererConfig {
    name: string;
    component: React.ComponentType<any>;
}

export interface LayoutRendererProps {
    name: string;
    component: React.ComponentType<any>;
}

export const LayoutRenderer = ({ name, component }: LayoutRendererProps) => {
    const getId = useIdGenerator("FormLayoutRenderer");

    return (
        <ConnectToProperties name={"AdminConfig"}>
            <Property
                id={getId(name)}
                name={"layoutRenderers"}
                array={true}
                value={{ name, component }}
            />
        </ConnectToProperties>
    );
};
