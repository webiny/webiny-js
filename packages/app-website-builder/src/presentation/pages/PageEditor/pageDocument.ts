import type { EditorPage } from "@webiny/website-builder-sdk";
import type { Page } from "~/domain/Page/index.js";

/** Map a loaded page revision onto the editor document shape. */
export const pageToEditorDocument = (page: Page): EditorPage => {
    return {
        ...page,
        id: page.id,
        version: page.version,
        status: page.status,
        location: page.location,
        properties: page.properties as EditorPage["properties"],
        bindings: page.bindings,
        elements: page.elements,
        metadata: page.metadata,
        state: {}
    };
};
