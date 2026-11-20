import { createAbstraction } from "@webiny/feature/admin";
import type { EditorPage } from "@webiny/website-builder-sdk";
import type { Editor } from "~/editorSdk/Editor.js";

/**
 * The page is delivered with its layout. When another layout is picked in the page settings, the
 * presenter loads it, so the preview renders the page in it right away.
 */
export interface IPageLayoutPresenter {
    /**
     * Start keeping the open page's layout in step with the layout picked in its settings. A layout
     * that can't be loaded (e.g., deleted) renders as none, as on the live site, and isn't loaded again
     * until another one is picked. Returns a function that stops it.
     */
    init(editor: Editor<EditorPage>): () => void;
}

export const PageLayoutPresenter = createAbstraction<IPageLayoutPresenter>(
    "PageEditor/PageLayoutPresenter"
);

export namespace PageLayoutPresenter {
    export type Interface = IPageLayoutPresenter;
}
