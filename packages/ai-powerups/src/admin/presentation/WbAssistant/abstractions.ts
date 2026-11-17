import { createAbstraction } from "@webiny/feature/admin";
import type { PageEditor } from "./types.js";

export interface IPageEditorAssistantPresenter {
    /**
     * Connect the assistant to the page editor: describe the page with every question, and offer
     * the tools that change it, unless the editor is read-only. Replaces any earlier connection.
     */
    attach(editor: PageEditor): void;
    /** Describe the page again, after the selection changed. */
    refresh(): void;
    /** Take the page context and the tools away, when the editor closes. */
    detach(): void;
}

/** Connects the page editor to the admin assistant while the editor is open. */
export const PageEditorAssistantPresenter = createAbstraction<IPageEditorAssistantPresenter>(
    "WbAssistant/PageEditorAssistantPresenter"
);

export namespace PageEditorAssistantPresenter {
    export type Interface = IPageEditorAssistantPresenter;
}
