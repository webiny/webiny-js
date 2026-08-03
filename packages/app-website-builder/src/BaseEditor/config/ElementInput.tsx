import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import type {
    ComponentInput,
    DocumentElement,
    DocumentElementBindings,
    InputAstNode,
    TokenReference
} from "@webiny/website-builder-sdk";
import type { InputBindingOnChange } from "../defaultConfig/Sidebar/ElementSettings/useInputValue.js";
import type { IMetadata } from "~/BaseEditor/metadata/index.js";

export interface ElementInputRendererProps {
    label: React.ReactNode;
    metadata: IMetadata;
    value: any;
    /**
     * Set when this input is bound to a design token rather than a literal.
     *
     * Passed separately from `value` because a token binding has no `static` value — a picker that only
     * received `value` could render the resolved colour but could not show *which* token is selected, so
     * reopening it would look like nothing was chosen.
     */
    token?: TokenReference;
    onChange: InputBindingOnChange;
    onPreviewChange: InputBindingOnChange;
    input: ComponentInput;
    // The full AST node, owning element and element bindings - provided by `InputField` and used by
    // renderers that recurse into child inputs (e.g. the object field renderer). Optional so other
    // call sites that synthesize renderer props (e.g. the Lexical expanded-editor dialog) needn't.
    node?: InputAstNode;
    element?: DocumentElement;
    bindings?: DocumentElementBindings["inputs"];
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
