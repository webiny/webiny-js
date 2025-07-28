// @ts-nocheck This is pending implementation!
import React from "react";
import { InputAstNode } from "@webiny/website-builder-sdk";
import { InputField } from "./InputField";

export function FieldArray({
    node,
    bindings
}: {
    node: InputAstNode;
    bindings: Record<string, any>;
}) {
    // Determine how many items there are
    const items = new Set(
        Object.keys(bindings)
            .filter(key => key.startsWith(`${node.name}[`))
            .map(key => {
                const match = key.match(/\[(\d+)\]/);
                return match ? Number(match[1]) : null;
            })
            .filter((i): i is number => i !== null)
    );

    return (
        <fieldset>
            <legend>{node.input.label || node.name}</legend>
            {[...items].map(index => {
                return (
                    <div key={index} style={{ border: "1px solid #ccc", padding: "0.5em" }}>
                        {node.children.map(child => {
                            const cloned = {
                                ...child,
                                path: `${node.name}[${index}].${child.name}`
                            };
                            return (
                                <InputField key={cloned.path} node={cloned} bindings={bindings} />
                            );
                        })}
                    </div>
                );
            })}
        </fieldset>
    );
}
