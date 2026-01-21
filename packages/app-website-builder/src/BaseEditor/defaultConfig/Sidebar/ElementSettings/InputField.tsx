import React from "react";
import type { InputAstNode } from "@webiny/website-builder-sdk";
import { useInputRenderer } from "./useInputRenderer.js";
import { useInputValue } from "./useInputValue.js";
import type { DocumentElement } from "@webiny/website-builder-sdk";
import { InheritanceLabel } from "../InheritanceLabel.js";

interface InputFieldProps {
    node: InputAstNode;
    element: DocumentElement;
}

export function InputField({ element, node }: InputFieldProps) {
    const Renderer = useInputRenderer(node.input.renderer!);
    const { value, onChange, onPreviewChange, inheritanceMap, metadata, onReset } = useInputValue(
        element.id,
        node
    );
    const input = node.input;

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
            astNode={node}
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
