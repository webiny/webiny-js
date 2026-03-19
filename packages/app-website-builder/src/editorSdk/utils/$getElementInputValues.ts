import type { ComponentManifest, Document } from "@webiny/website-builder-sdk";
import {
    BindingsResolver,
    ComponentManifestToAstConverter,
    type InputAstNode
} from "@webiny/website-builder-sdk";

export interface ResolvedElementInputs {
    [key: string]: any;
}

function resolveElement(
    document: Document,
    components: Record<string, ComponentManifest>,
    elementId: string,
    depth: number
): ResolvedElementInputs {
    const element = document.elements[elementId];
    if (!element) {
        return {};
    }

    const manifest = components[element.component.name];
    if (!manifest) {
        return {};
    }

    const elementBindings = document.bindings[elementId] ?? {};
    const inputAst = ComponentManifestToAstConverter.convert(manifest.inputs ?? []);
    const resolver = new BindingsResolver(document.state);

    const [resolved] = resolver.resolveElement({
        element,
        elementBindings,
        inputAst
    });

    const inputs = resolved?.inputs ?? {};

    if (depth <= 0) {
        return inputs;
    }

    return resolveSlotsByAst(document, components, inputs, inputAst, depth);
}

/**
 * Walk the resolved inputs using the AST to identify slot values,
 * and resolve slot element IDs into their resolved inputs.
 */
function resolveSlotsByAst(
    document: Document,
    components: Record<string, ComponentManifest>,
    inputs: Record<string, any>,
    ast: InputAstNode[],
    depth: number
): Record<string, any> {
    const result: Record<string, any> = { ...inputs };

    for (const node of ast) {
        const value = inputs[node.name];
        if (value === undefined) {
            continue;
        }

        if (node.type === "slot") {
            result[node.name] = resolveSlotValue(document, components, value, depth);
        } else if (node.children.length > 0) {
            // Object or object-list — recurse into children using their AST.
            if (node.list && Array.isArray(value)) {
                result[node.name] = value.map(item =>
                    resolveSlotsByAst(document, components, item, node.children, depth)
                );
            } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                result[node.name] = resolveSlotsByAst(
                    document,
                    components,
                    value,
                    node.children,
                    depth
                );
            }
        }
    }

    return result;
}

/**
 * Resolve a slot value: a single element ID string, or an array of element ID strings.
 */
function resolveSlotValue(
    document: Document,
    components: Record<string, ComponentManifest>,
    value: any,
    depth: number
): any {
    if (typeof value === "string" && document.elements[value]) {
        const resolved = resolveElement(document, components, value, depth - 1);
        return { elementId: value, ...resolved };
    }

    if (Array.isArray(value)) {
        return value.map(item => resolveSlotValue(document, components, item, depth));
    }

    return value;
}

export function $getElementInputValues(
    document: Document,
    components: Record<string, ComponentManifest>,
    elementId: string | null,
    depth = 0
) {
    if (!elementId) {
        return {};
    }

    return resolveElement(document, components, elementId, depth);
}
