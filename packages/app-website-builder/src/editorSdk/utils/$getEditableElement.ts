import type { Document } from "@webiny/website-builder-sdk";

/**
 * An element whose inputs can be edited in the open document: one of its own, or, in the page editor,
 * one of its layout's own elements. The page overrides a layout element's inputs under its id in the
 * page's bindings; its place in the layout can't be changed from the page.
 */
export function $getEditableElement(document: Pick<Document, "elements" | "layout">, id: string) {
    return document.elements[id] ?? document.layout?.elements?.[id];
}

// Whether an element belongs to the open document's layout, not to the document itself.
export function $isLayoutElement(document: Pick<Document, "elements" | "layout">, id: string) {
    return !document.elements[id] && Boolean(document.layout?.elements?.[id]);
}
