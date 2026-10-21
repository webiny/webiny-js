import { createAbstraction } from "@webiny/feature/admin";
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
 * editor document shape.
 */
export interface ILayoutEditorPresenter {
    readonly vm: ILayoutEditorVm;
    // Load a layout revision. A load started before it is ignored once it finishes.
    load(id: string): Promise<void>;
}

export const LayoutEditorPresenter = createAbstraction<ILayoutEditorPresenter>(
    "WebsiteBuilder/LayoutEditorPresenter"
);

export namespace LayoutEditorPresenter {
    export type Interface = ILayoutEditorPresenter;
    export type ViewModel = ILayoutEditorVm;
}
