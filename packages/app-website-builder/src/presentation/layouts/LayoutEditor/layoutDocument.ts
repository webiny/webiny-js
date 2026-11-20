import type { EditorDocument } from "@webiny/website-builder-sdk";
import type { WbStatus } from "~/constants.js";
import type { Layout, LayoutPreviewPage } from "~/features/layouts/index.js";
import { LAYOUT_PREVIEW_PATH } from "../constants.js";

/**
 * A layout revision as the editor document. Like the page editor's document, it carries the revision's
 * `version` and `status` at the top level (plus `locked` and `entryId`), so top bar items can read them.
 *
 * `previewPage` is the page the layout is previewed with: rendered in the preview, never saved.
 */
export type LayoutEditorDocument = EditorDocument & {
    entryId: string;
    status: WbStatus;
    locked: boolean;
    previewPage?: LayoutPreviewPage | null;
};

/** Map a layout revision onto the editor document shape. Its preview is rendered on the frontend's layout route. */
export const layoutToEditorDocument = (layout: Layout): LayoutEditorDocument => {
    return {
        id: layout.id,
        entryId: layout.entryId,
        version: layout.version,
        status: layout.status,
        locked: layout.locked,
        state: {},
        extensions: layout.extensions ?? {},
        properties: {
            id: layout.id,
            title: layout.properties.title,
            slug: layout.properties.slug ?? null,
            language: layout.properties.language ?? null,
            sourceLayout: layout.properties.sourceLayout ?? null,
            path: LAYOUT_PREVIEW_PATH
        },
        metadata: {
            ...layout.metadata,
            documentType: "layout"
        },
        elements: layout.elements,
        bindings: layout.bindings,
        previewPage: null
    };
};
