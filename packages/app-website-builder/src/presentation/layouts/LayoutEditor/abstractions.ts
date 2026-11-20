import { createAbstraction } from "@webiny/feature/admin";
import type { EditorDocument } from "@webiny/website-builder-sdk";
import type { Editor } from "~/editorSdk/Editor.js";
import type { LayoutEditorDocument } from "./layoutDocument.js";

export interface ILayoutEditorVm {
    loading: boolean;
    // Why the layout could not be loaded, or `null`.
    error: string | null;
    // The layout revision as an editor document, once it's loaded.
    document: LayoutEditorDocument | null;
    // A published or locked revision opens read-only.
    readOnly: boolean;
}

/**
 * The layout editor: loads the website settings and a layout revision, and maps the revision onto the
 * editor document shape. In the open editor, it names the Named content inserted into the layout.
 */
export interface ILayoutEditorPresenter {
    readonly vm: ILayoutEditorVm;
    // Load a layout revision. A load started before it is ignored once it finishes.
    load(id: string): Promise<void>;
    /**
     * Give Named content inserted into the layout open in the editor a name of its own (`area-2`, ...),
     * so authors can tell the areas apart. Returns a function that stops it.
     */
    nameContentAreas<TDocument extends EditorDocument>(editor: Editor<TDocument>): () => void;
}

export const LayoutEditorPresenter = createAbstraction<ILayoutEditorPresenter>(
    "WebsiteBuilder/LayoutEditorPresenter"
);

export namespace LayoutEditorPresenter {
    export type Interface = ILayoutEditorPresenter;
    export type ViewModel = ILayoutEditorVm;
}
