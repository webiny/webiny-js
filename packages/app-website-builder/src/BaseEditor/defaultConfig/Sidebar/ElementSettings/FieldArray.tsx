import React, { useMemo } from "react";
import type { DocumentElement, InputAstNode } from "@webiny/website-builder-sdk";
import { InputField } from "./InputField.js";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import type { InputBindingOnChange } from "~/BaseEditor/defaultConfig/Sidebar/ElementSettings/useInputValue.js";

interface FieldArrayProps {
    onChange: InputBindingOnChange;
    node: InputAstNode;
    element: DocumentElement;
}

export function FieldArray({ node, element }: FieldArrayProps) {
    const bindings = useSelectFromDocument(
        document => {
            return document.bindings[element.id] ?? { inputs: {} };
        },
        [element.id]
    );

    // Parse bindings to discover array indices
    const indices = useMemo(() => {
        const inputKeys = Object.keys(bindings.inputs || {});

        // Create a regex pattern that matches: "nodePath/INDEX/anything"
        // For example, if node.path is "cards", it matches "cards/0/title", "cards/1/price", etc.
        const pattern = new RegExp(`^${node.path}/(\\d+)/`);

        const foundIndices = new Set<number>();

        inputKeys.forEach(key => {
            const match = key.match(pattern);
            if (match) {
                const index = parseInt(match[1], 10);
                foundIndices.add(index);
            }
        });

        // Convert Set to sorted array
        return Array.from(foundIndices).sort((a, b) => a - b);
    }, [bindings.inputs, node.path]);

    return (
        <fieldset>
            <legend>{node.input.label || node.name}</legend>
            {indices.length === 0 && (
                <div style={{ padding: "0.5em", color: "#666", fontStyle: "italic" }}>
                    No items yet
                </div>
            )}
            {indices.map(index => {
                return (
                    <div key={index} style={{ border: "1px solid #ccc", padding: "0.5em", marginBottom: "0.5em" }}>
                        <div style={{ fontWeight: "bold", marginBottom: "0.25em" }}>
                            Item {index}
                        </div>
                        {node.children.map(child => {
                            // Create a cloned node with the updated path
                            // Child path is like "cards/title", we need to replace "cards" with "cards/0"
                            // Pattern: parentPath/index/childName
                            const childPathWithoutParent = child.path.substring(node.path.length + 1);
                            const clonedNode: InputAstNode = {
                                ...child,
                                path: `${node.path}/${index}/${childPathWithoutParent}`
                            };

                            return (
                                <InputField
                                    key={clonedNode.path}
                                    element={element}
                                    node={clonedNode}
                                />
                            );
                        })}
                    </div>
                );
            })}
        </fieldset>
    );
}
