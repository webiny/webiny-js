import { createAbstraction } from "@webiny/feature/admin";
import type { Editor } from "~/editorSdk/Editor.js";
import type { LayoutEditorDocument } from "../layoutDocument.js";

// Remembers the page a layout was last previewed with, per layout entry.
export interface ILayoutPreviewPageStorage {
    get(layoutEntryId: string): string | null;
    set(layoutEntryId: string, pageId: string | null): void;
}

export const LayoutPreviewPageStorage = createAbstraction<ILayoutPreviewPageStorage>(
    "WebsiteBuilder/LayoutPreviewPageStorage"
);

export namespace LayoutPreviewPageStorage {
    export type Interface = ILayoutPreviewPageStorage;
}

export interface ILayoutPreviewPageOptionVm {
    label: string;
    value: string;
}

export interface ILayoutPreviewPageVm {
    // Pages in the layout's language; all pages for a layout without a language.
    options: ILayoutPreviewPageOptionVm[];
    selectedPageId: string | null;
    loading: boolean;
}

/**
 * Preview the layout open in the editor with a page: the picked page (as it's delivered) is set on the
 * editor document as `previewPage`, which the preview renders in the layout. The choice is remembered
 * per layout.
 */
export interface ILayoutPreviewPagePresenter {
    readonly vm: ILayoutPreviewPageVm;
    // List the pages and restore the remembered choice. Returns a function that stops it.
    init(editor: Editor<LayoutEditorDocument>): () => void;
    // Pick a page, or `null` to preview the layout on its own.
    select(pageId: string | null): Promise<void>;
}

export const LayoutPreviewPagePresenter = createAbstraction<ILayoutPreviewPagePresenter>(
    "WebsiteBuilder/LayoutPreviewPagePresenter"
);

export namespace LayoutPreviewPagePresenter {
    export type Interface = ILayoutPreviewPagePresenter;
    export type ViewModel = ILayoutPreviewPageVm;
}
