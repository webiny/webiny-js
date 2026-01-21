import React, { useMemo, useCallback } from "react";
import type { DocumentElement, InputAstNode } from "@webiny/website-builder-sdk";
import { InputField } from "./InputField.js";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import type { InputBindingOnChange } from "~/BaseEditor/defaultConfig/Sidebar/ElementSettings/useInputValue.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils/generateId.js";

interface FieldArrayProps {
    onChange: InputBindingOnChange;
    node: InputAstNode;
    element: DocumentElement;
}

export function FieldArray({ node, element }: FieldArrayProps) {
    const editor = useDocumentEditor();
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

    const handleAdd = useCallback(() => {
        editor.updateDocument(document => {
            const elementBindings = document.bindings[element.id];
            if (!elementBindings.inputs) {
                elementBindings.inputs = {};
            }

            // Find the next available index
            const nextIndex = indices.length > 0 ? Math.max(...indices) + 1 : 0;

            // Create bindings for all child inputs with default values
            node.children.forEach(child => {
                const childPathWithoutParent = child.path.substring(node.path.length + 1);
                const newPath = `${node.path}/${nextIndex}/${childPathWithoutParent}`;

                elementBindings.inputs![newPath] = {
                    id: generateAlphaNumericLowerCaseId(),
                    static: child.input.defaultValue,
                    type: child.input.type,
                    list: false
                };
            });
        });
    }, [editor, element.id, indices, node]);

    const handleRemove = useCallback(
        (indexToRemove: number) => {
            editor.updateDocument(document => {
                const elementBindings = document.bindings[element.id];
                if (!elementBindings.inputs) {
                    return;
                }

                // Remove all bindings that match this index
                const pattern = new RegExp(`^${node.path}/${indexToRemove}/`);
                Object.keys(elementBindings.inputs).forEach(key => {
                    if (pattern.test(key)) {
                        delete elementBindings.inputs![key];
                    }
                });
            });
        },
        [editor, element.id, node.path]
    );

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
                    <div
                        key={index}
                        style={{
                            border: "1px solid #ccc",
                            padding: "0.5em",
                            marginBottom: "0.5em"
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "0.25em"
                            }}
                        >
                            <div style={{ fontWeight: "bold" }}>Item {index}</div>
                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                style={{
                                    padding: "0.25em 0.5em",
                                    backgroundColor: "#dc3545",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "3px",
                                    cursor: "pointer",
                                    fontSize: "0.85em"
                                }}
                            >
                                Remove
                            </button>
                        </div>
                        {node.children.map(child => {
                            // Create a cloned node with the updated path
                            // Child path is like "cards/title", we need to replace "cards" with "cards/0"
                            // Pattern: parentPath/index/childName
                            const childPathWithoutParent = child.path.substring(
                                node.path.length + 1
                            );
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
            <button
                type="button"
                onClick={handleAdd}
                style={{
                    marginTop: "0.5em",
                    padding: "0.5em 1em",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                    width: "100%"
                }}
            >
                Add Item
            </button>
        </fieldset>
    );
}
