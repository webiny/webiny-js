import { ElementFactory } from "@webiny/website-builder-sdk";
import type { ComponentManifest, Document } from "@webiny/website-builder-sdk";

export interface ComponentPlacement {
    manifest: ComponentManifest;
    /** Input values for this instance, keyed by input name. */
    inputs: Record<string, unknown>;
}

export interface PageDocumentContent {
    elements: Document["elements"];
    bindings: Document["bindings"];
}

const ROOT_ID = "root";

/**
 * The `elements` and `bindings` of a page holding the given components, in the given order.
 *
 * Built through `ElementFactory` rather than by hand because document order does not live in the
 * elements map: a child records `parent: { id, slot }`, and the parent's `bindings.root.inputs.children`
 * static array is what the renderer reads to order them. `AddToParent` maintains that array, appending
 * when no index is passed — so iterating placements in Assemble's order is enough to preserve it.
 *
 * The factory needs each component's manifest to emit correctly typed input bindings, which is why
 * this package has to recover one (see `src/manifest/extractComponentManifest.ts`).
 */
export const buildPageDocument = (params: {
    path: string;
    title: string;
    placements: ComponentPlacement[];
}): PageDocumentContent => {
    const { path, title, placements } = params;

    // A scratch document to apply operations against. Only `elements` and `bindings` are handed to
    // `CreatePageUseCase`; the rest of the shape exists because the operations expect a Document.
    const document: Document = {
        id: "page-composition-poc",
        version: 1,
        state: {},
        properties: { path, title },
        extensions: {},
        metadata: {},
        bindings: {},
        elements: {
            [ROOT_ID]: {
                type: "Webiny/Element",
                id: ROOT_ID,
                component: { name: "Webiny/Root" }
            }
        }
    };

    // One registry for the whole page: a component used twice is registered once, and the factory
    // resolves nested slot components through the same map.
    const registry: Record<string, ComponentManifest> = {};
    for (const placement of placements) {
        registry[placement.manifest.name] = placement.manifest;
    }

    const factory = new ElementFactory(registry);

    for (const placement of placements) {
        const { operations } = factory.createElementFromComponent({
            componentName: placement.manifest.name,
            parentId: ROOT_ID,
            slot: "children",
            bindings: { inputs: placement.inputs }
        });

        for (const operation of operations) {
            operation.apply(document);
        }
    }

    return { elements: document.elements, bindings: document.bindings };
};
