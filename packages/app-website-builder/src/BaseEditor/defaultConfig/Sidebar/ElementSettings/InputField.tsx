import React from "react";
import type { InputAstNode } from "@webiny/website-builder-sdk";
import { useInputRenderer } from "./useInputRenderer.js";
import { useInputValue } from "./useInputValue.js";
import type { DocumentElement, DocumentElementBindings } from "@webiny/website-builder-sdk";
import { InheritanceLabel } from "../InheritanceLabel.js";
import { ObjectField } from "./ObjectField.js";
import { ObjectListField } from "./ObjectListField.js";

interface InputFieldProps {
    node: InputAstNode;
    element: DocumentElement;
    bindings: DocumentElementBindings["inputs"];
}

export function InputField({ element, node, bindings }: InputFieldProps) {
    const Renderer = useInputRenderer(node.input.renderer!);
    const { value, onChange, onPreviewChange, inheritanceMap, metadata, onReset } = useInputValue(
        element.id,
        node
    );
    const input = node.input;

    if (input.type === "object") {
        if (node.list) {
            return (
                <ObjectListField
                    element={element}
                    node={node}
                    bindings={bindings}
                    value={value}
                    onChange={onChange}
                />
            );
        }

        return <ObjectField element={element} node={node} bindings={bindings} />;
    }

    const label = node.input.responsive ? (
        <InheritanceLabel
            text={input.label}
            inheritedFrom={inheritanceMap?.inheritedFrom}
            isOverridden={inheritanceMap?.overridden ?? false}
            onReset={onReset}
        />
    ) : (
        input.label
    );

    return (
        <Renderer
            metadata={metadata}
            label={label}
            value={value?.static}
            onChange={onChange}
            onPreviewChange={onPreviewChange}
            input={node.input}
        />
    );

    // We'll implement expression bindings at a later stage.
    /*return value.expression ? (
        <WithBindingToggle type={"expression"} setBindingType={setBindingType}>
            <ExpressionRenderer
                element={activeElement!}
                value={value.expression}
                onChange={onChange}
                input={input}
            />
        </WithBindingToggle>
    ) : (
        <WithBindingToggle type={"static"} setBindingType={setBindingType}>
            <Renderer
                value={value.static}
                onChange={onChange}
                onPreviewChange={onPreviewChange}
                input={node.input}
            />
        </WithBindingToggle>
    );*/
}
