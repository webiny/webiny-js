import type { InputAstNode } from "@webiny/website-builder-sdk";

/**
 * Returns a sensible empty value for a leaf input type. This guarantees that a freshly added
 * list item has at least one defined leaf binding - without it, an "empty" item produces no
 * bindings at all and would silently disappear on the next render (the item count is derived
 * from the flat leaf bindings).
 */
function emptyValueForType(type: string, list: boolean): any {
    if (list) {
        return [];
    }

    switch (type) {
        case "number":
            return 0;
        case "boolean":
            return false;
        case "slot":
            return undefined;
        default:
            return "";
    }
}

/**
 * Builds a default value for a single input node, falling back to a type-based empty when no
 * explicit `defaultValue` is configured. Nested objects are built recursively.
 */
export function buildDefaultValue(node: InputAstNode): any {
    if (node.type === "object") {
        if (node.list) {
            return node.input.defaultValue ?? [];
        }

        return buildDefaultObject(node.children);
    }

    if (node.input.defaultValue !== undefined) {
        return node.input.defaultValue;
    }

    return emptyValueForType(node.type, node.list);
}

/**
 * Builds a default object for an object field from its child input nodes.
 */
export function buildDefaultObject(children: InputAstNode[]): Record<string, any> {
    const result: Record<string, any> = {};

    for (const child of children) {
        result[child.name] = buildDefaultValue(child);
    }

    return result;
}
