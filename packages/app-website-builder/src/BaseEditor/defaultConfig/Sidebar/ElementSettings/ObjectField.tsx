import React, { useState } from "react";
import type {
    DocumentElement,
    DocumentElementBindings,
    InputAstNode
} from "@webiny/website-builder-sdk";
import { InputField } from "./InputField.js";
import {
    ObjectFieldHeader,
    ObjectFieldPanel,
    ObjectRow,
    useDrawerDepth
} from "~/inputRenderers/ObjectInput/index.js";

interface ObjectFieldProps {
    node: InputAstNode;
    element: DocumentElement;
    bindings: DocumentElementBindings["inputs"];
}

/**
 * A single (non-list) object field. Rendered as one row that opens a drawer containing the
 * object's child inputs, recursed through `InputField`.
 */
export function ObjectField({ element, node, bindings }: ObjectFieldProps) {
    const [open, setOpen] = useState(false);
    const depth = useDrawerDepth();
    const label = node.input.label ?? node.name;

    return (
        <div className={"flex flex-col gap-xs"}>
            <ObjectFieldHeader description={node.input.description} />
            <ObjectRow title={label} onOpen={() => setOpen(true)} />
            <ObjectFieldPanel
                open={open}
                onClose={() => setOpen(false)}
                title={label}
                depth={depth}
            >
                {node.children.map(child => (
                    <InputField
                        key={child.path}
                        element={element}
                        node={child}
                        bindings={bindings}
                    />
                ))}
            </ObjectFieldPanel>
        </div>
    );
}
