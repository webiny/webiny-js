import { createAbstraction } from "@webiny/feature/admin";
import type { EditorPage } from "@webiny/website-builder-sdk";

export interface IPageEditorVm {
    loading: boolean;
    // Why the page could not be loaded, or `null`.
    error: string | null;
    // The page as the editor opens it, with its layout and global components composed in, once it's loaded.
    page: EditorPage | null;
}

/**
 * The page editor: loads the website settings and a page revision, resolves the page's layout and the
 * global components in its language, and composes them into the editor document.
 */
export interface IPageEditorPresenter {
    readonly vm: IPageEditorVm;
    // Load a page revision. A load started before it is ignored once it finishes.
    load(id: string): Promise<void>;
}

export const PageEditorPresenter = createAbstraction<IPageEditorPresenter>(
    "WebsiteBuilder/PageEditorPresenter"
);

export namespace PageEditorPresenter {
    export type Interface = IPageEditorPresenter;
    export type ViewModel = IPageEditorVm;
}
