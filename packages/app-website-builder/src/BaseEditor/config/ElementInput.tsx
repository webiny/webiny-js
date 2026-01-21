import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import type { ComponentInput, InputAstNode } from "@webiny/website-builder-sdk";
import type { InputBindingOnChange } from "../defaultConfig/Sidebar/ElementSettings/useInputValue.js";
import type { IMetadata } from "~/BaseEditor/metadata/index.js";

export interface ElementInputRendererProps {
    label: React.ReactNode;
    metadata: IMetadata;
    value: any;
    onChange: InputBindingOnChange;
    onPreviewChange: InputBindingOnChange;
    input: ComponentInput;
    astNode: InputAstNode;
}

export interface RendererProps {
    name: string;
    component: React.ComponentType<any>;
}

const Renderer = (props: RendererProps) => {
    const getId = useIdGenerator("inputRenderer");
    const { name, component } = props;

    return (
        <Property id={getId(name)} name={"inputRenderers"} array={true}>
            <Property id={getId(name, "name")} name={"name"} value={name} />
            <Property id={getId(name, "component")} name={"component"} value={component} />
        </Property>
    );
};

export interface ElementInputConfig {
    name: string;
    component: React.ComponentType<ElementInputRendererProps>;
}

export const ElementInput = {
    Renderer
};
