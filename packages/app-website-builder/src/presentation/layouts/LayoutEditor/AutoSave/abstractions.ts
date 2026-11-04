import { createAbstraction } from "@webiny/feature/admin";
import type { EditorDocument } from "@webiny/website-builder-sdk";
import type { Editor } from "~/editorSdk/Editor.js";

/**
 * A draft layout revision is saved as it's edited. A published revision is opened read-only: changing it
 * takes a new revision. The layout is saved as stored: without the global instances it shows, and with
 * its overrides of them.
 */
export interface ILayoutAutoSavePresenter {
    /**
     * Save the layout open in the editor as it's edited. Returns a function that stops it, saving a
     * pending change right away.
     */
    init<TDocument extends EditorDocument>(editor: Editor<TDocument>): () => void;
}

export const LayoutAutoSavePresenter = createAbstraction<ILayoutAutoSavePresenter>(
    "WebsiteBuilder/LayoutEditor/AutoSavePresenter"
);

export namespace LayoutAutoSavePresenter {
    export type Interface = ILayoutAutoSavePresenter;
}
