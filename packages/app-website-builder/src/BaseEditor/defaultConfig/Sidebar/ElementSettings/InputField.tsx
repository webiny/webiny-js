import React, { useState } from "react";
import type { InputAstNode } from "@webiny/website-builder-sdk";
import { useInputRenderer } from "./useInputRenderer.js";
import { useInputValue } from "./useInputValue.js";
import type { InputBindingOnChange } from "./useInputValue.js";
import type { DocumentElement, DocumentElementBindings } from "@webiny/website-builder-sdk";
import { InheritanceLabel } from "../InheritanceLabel.js";
import { buildDefaultObject } from "./buildDefaultObject.js";
import {
    ObjectAddButton,
    ObjectEmptyState,
    ObjectFieldPanel,
    ObjectFieldHeader,
    ObjectRow,
    ObjectRowActions,
    useDrawerDepth
} from "~/inputRenderers/ObjectInput.js";

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
}

/**
 * A single (non-list) object field. Rendered as one row that opens a drawer containing the
 * object's child inputs, recursed through `InputField`.
 */
interface ObjectFieldProps {
    node: InputAstNode;
    element: DocumentElement;
    bindings: DocumentElementBindings["inputs"];
}

function ObjectField({ element, node, bindings }: ObjectFieldProps) {
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

/**
 * A repeatable (list) object field. Rendered as a list of rows (one per item) plus an "Add"
 * button; clicking a row opens that item's drawer. Add / remove / reorder rewrite the whole array
 * and commit it through the container's `onChange`. Each item's fields are rendered as nested
 * `InputField`s with index-qualified paths (e.g. `items/0/label`).
 */
interface ObjectListFieldProps {
    node: InputAstNode;
    element: DocumentElement;
    bindings: DocumentElementBindings["inputs"];
    value: any;
    onChange: InputBindingOnChange;
}

function ObjectListField({ element, node, bindings, value, onChange }: ObjectListFieldProps) {
    const items: any[] = Array.isArray(value) ? value : [];
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    // The index whose panel is shown. Retained while closing so the content stays put during the
    // exit transition (openIndex goes null immediately, activeIndex lingers).
    const [activeIndex, setActiveIndex] = useState(0);
    const depth = useDrawerDepth();
    const label = node.input.label ?? node.name;

    const openItem = (index: number) => {
        setActiveIndex(index);
        setOpenIndex(index);
    };

    const commit = (next: any[]) => {
        onChange(({ value }) => {
            value.set(next);
        });
    };

    const handleAdd = () => {
        commit([...items, buildDefaultObject(node.children)]);
    };

    const handleRemove = (index: number) => {
        setOpenIndex(null);
        commit(items.filter((_, i) => i !== index));
    };

    const handleMoveUp = (index: number) => {
        if (index <= 0) {
            return;
        }
        const next = [...items];
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        commit(next);
    };

    const handleMoveDown = (index: number) => {
        if (index >= items.length - 1) {
            return;
        }
        const next = [...items];
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
        commit(next);
    };

    return (
        <div className={"flex flex-col gap-sm"}>
            <ObjectFieldHeader label={label} description={node.input.description} />

            {items.length === 0 ? (
                <ObjectEmptyState onAdd={handleAdd} />
            ) : (
                <>
                    <div className={"flex flex-col gap-sm"}>
                        {items.map((item, index) => (
                            <ObjectRow
                                key={`${node.path}/${index}`}
                                title={deriveItemTitle(node, item, index)}
                                onOpen={() => openItem(index)}
                                actions={
                                    <ObjectRowActions
                                        onMoveUp={() => handleMoveUp(index)}
                                        onMoveDown={() => handleMoveDown(index)}
                                        onRemove={() => handleRemove(index)}
                                        canMoveUp={index > 0}
                                        canMoveDown={index < items.length - 1}
                                    />
                                }
                            />
                        ))}
                    </div>
                    <ObjectAddButton onClick={handleAdd} />
                </>
            )}

            <ObjectFieldPanel
                open={openIndex !== null}
                onClose={() => setOpenIndex(null)}
                title={deriveItemTitle(node, items[activeIndex], activeIndex)}
                depth={depth}
            >
                {node.children.map(child => {
                    const indexedChild = withIndexedPath(child, node.path, activeIndex);
                    return (
                        <InputField
                            key={indexedChild.path}
                            element={element}
                            node={indexedChild}
                            bindings={bindings}
                        />
                    );
                })}
            </ObjectFieldPanel>
        </div>
    );
}

/**
 * Derives a human-readable title for a list item: the first non-empty text value found among its
 * fields, falling back to "<label> #<n>".
 */
function deriveItemTitle(node: InputAstNode, item: any, index: number): string {
    const label = node.input.label ?? node.name;

    if (item && typeof item === "object") {
        for (const child of node.children) {
            const childValue = item[child.name];
            if (
                (child.type === "text" || child.type === "longText") &&
                typeof childValue === "string" &&
                childValue.trim()
            ) {
                return childValue;
            }
        }
    }

    return `${label} #${index + 1}`;
}

/**
 * Rewrites an AST node (and its descendants) so that paths under a list container include the
 * given item index, e.g. `items/label` -> `items/0/label`.
 */
function withIndexedPath(node: InputAstNode, listPath: string, index: number): InputAstNode {
    const prefix = `${listPath}/`;
    const indexedPrefix = `${listPath}/${index}/`;

    const rewrite = (current: InputAstNode): InputAstNode => ({
        ...current,
        path: current.path.startsWith(prefix)
            ? indexedPrefix + current.path.slice(prefix.length)
            : current.path,
        children: current.children.map(rewrite)
    });

    return rewrite(node);
}
