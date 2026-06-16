import React from "react";
import type { InputAstNode } from "@webiny/website-builder-sdk";
import { useInputRenderer } from "./useInputRenderer.js";
import { useInputValue } from "./useInputValue.js";
import type { InputBindingOnChange } from "./useInputValue.js";
import type { DocumentElement, DocumentElementBindings } from "@webiny/website-builder-sdk";
import { InheritanceLabel } from "../InheritanceLabel.js";
import { buildDefaultObject } from "./buildDefaultObject.js";
import {
    ObjectFieldShell,
    ObjectListShell,
    type ObjectListItem
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
 * Renders a single (non-list) object field by recursing into its child inputs. Each child is a
 * regular `InputField` with its own fully-qualified (nested) path, so values, breakpoints and the
 * change pipeline all work exactly as they do for top-level inputs.
 */
interface ObjectFieldProps {
    node: InputAstNode;
    element: DocumentElement;
    bindings: DocumentElementBindings["inputs"];
}

function ObjectField({ element, node, bindings }: ObjectFieldProps) {
    return (
        <ObjectFieldShell label={node.input.label} description={node.input.description}>
            {node.children.map(child => (
                <InputField key={child.path} element={element} node={child} bindings={bindings} />
            ))}
        </ObjectFieldShell>
    );
}

/**
 * Renders a repeatable (list) object field. The list value is the deep array resolved by
 * `useInputValue` for the container node; add / remove / reorder rewrite the whole array and
 * commit it through the container's `onChange`. Each item's fields are rendered as nested
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

    const commit = (next: any[]) => {
        onChange(({ value }) => {
            value.set(next);
        });
    };

    const handleAdd = () => {
        commit([...items, buildDefaultObject(node.children)]);
    };

    const handleRemove = (index: number) => {
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

    const listItems: ObjectListItem[] = items.map((_, index) => ({
        key: `${node.path}/${index}`,
        content: node.children.map(child => {
            const indexedChild = withIndexedPath(child, node.path, index);
            return (
                <InputField
                    key={indexedChild.path}
                    element={element}
                    node={indexedChild}
                    bindings={bindings}
                />
            );
        })
    }));

    return (
        <ObjectListShell
            label={node.input.label}
            description={node.input.description}
            items={listItems}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
        />
    );
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
