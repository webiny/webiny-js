import type { ComponentManifest, Document } from "@webiny/website-builder-sdk";
import { BindingsResolver, ComponentManifestToAstConverter } from "@webiny/website-builder-sdk";

interface ResolvedElementInputs {
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

    return resolveSlots(document, components, inputs, depth);
}

function resolveSlots(
    document: Document,
    components: Record<string, ComponentManifest>,
    value: any,
    depth: number
): any {
    if (typeof value === "string" && document.elements[value]) {
        return resolveElement(document, components, value, depth - 1);
    }

    if (Array.isArray(value)) {
        return value.map(item => resolveSlots(document, components, item, depth));
    }

    if (value !== null && typeof value === "object") {
        const result: Record<string, any> = {};
        for (const [key, val] of Object.entries(value)) {
            result[key] = resolveSlots(document, components, val, depth);
        }
        return result;
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
