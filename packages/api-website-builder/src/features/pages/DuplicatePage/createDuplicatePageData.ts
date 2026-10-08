import type { WbPage } from "~/domain/page/abstractions.js";
import type { DuplicatePageData } from "./abstractions.js";

/**
 * Builds the complete data of the duplicated page, so it can be stored with a single create operation.
 * The data is deep-cloned once, so the duplicate never shares (or mutates) nested data of the original page.
 */
export const createDuplicatePageData = (original: WbPage): DuplicatePageData => {
    const duplicate: DuplicatePageData = structuredClone({
        bindings: original.bindings,
        elements: original.elements,
        location: original.location,
        properties: original.properties,
        metadata: original.metadata,
        extensions: original.extensions
    });

    duplicate.properties.path = `${original.properties.path}-copy`;
    duplicate.properties.title = `Copy of ${original.properties.title}`;

    return duplicate;
};
