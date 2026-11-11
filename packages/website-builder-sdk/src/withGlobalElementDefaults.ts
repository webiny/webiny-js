import type { ComponentManifest, DocumentElementBindings, GlobalDocument } from "./types.js";
import { GlobalElementId } from "./globalElements.js";
import { createGlobalElementDocument } from "./createGlobalElementDocument.js";

/**
 * Add a default instance for every registered global component that has no stored instance,
 * so a global defined in code appears immediately, without a data backfill.
 * The page may still come with bindings for such a global: the layout's and the page's overrides, merged by
 * the backend. They're kept over the defaults.
 */
export const withGlobalElementDefaults = (
    globals: GlobalDocument,
    components: Record<string, ComponentManifest>
): GlobalDocument => {
    const missing = Object.values(components).filter(manifest => {
        return (
            manifest.global && !globals.elements[GlobalElementId.fromName(manifest.name).toString()]
        );
    });

    if (!missing.length) {
        return globals;
    }

    const result: GlobalDocument = {
        elements: { ...globals.elements },
        bindings: { ...globals.bindings }
    };

    for (const manifest of missing) {
        const defaults = createGlobalElementDocument(manifest.name, components);
        Object.assign(result.elements, defaults.elements);
        for (const id in defaults.bindings) {
            const delivered = globals.bindings[id];
            result.bindings[id] = delivered
                ? withDefaultBindings(defaults.bindings[id], delivered)
                : defaults.bindings[id];
        }
    }

    return result;
};

/**
 * The defaults are only the bottom layer: what's delivered wins per input and per style, also per
 * breakpoint override, so overriding one input of a global keeps the rest of its defaults.
 */
const withDefaultBindings = (
    defaults: DocumentElementBindings,
    delivered: DocumentElementBindings
): DocumentElementBindings => {
    const overrides: NonNullable<DocumentElementBindings["overrides"]> = {
        ...defaults.overrides
    };
    for (const breakpoint in delivered.overrides) {
        const base = defaults.overrides?.[breakpoint];
        const value = delivered.overrides[breakpoint];
        overrides[breakpoint] = {
            ...base,
            ...value,
            inputs: { ...base?.inputs, ...value?.inputs },
            styles: { ...base?.styles, ...value?.styles }
        };
    }

    return {
        ...defaults,
        ...delivered,
        inputs: { ...defaults.inputs, ...delivered.inputs },
        styles: { ...defaults.styles, ...delivered.styles },
        overrides
    };
};
