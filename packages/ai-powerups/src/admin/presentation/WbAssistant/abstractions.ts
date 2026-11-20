import { createAbstraction } from "@webiny/feature/admin";
import type { PageEditor } from "./types.js";

export interface IPageEditorAssistantConnector {
    /**
     * Connect the assistant to the page editor: describe the page with every question, and offer
     * the tools that change it, unless the editor is read-only. Replaces any earlier connection.
     */
    attach(editor: PageEditor): void;
    /** Offer the tools, or take them away, after the editor turned editable or read-only. */
    syncTools(): void;
    /**
     * Carry on the chat on screen by asking it to build this page, for a page the assistant created
     * from another screen. Waits until the editor is attached and offers its tools. Asks nothing
     * when there is no chat to carry on.
     */
    continueBuild(): void;
    /** Describe the page again, after the selection changed. */
    refresh(): void;
    /**
     * Take the page context and the tools away, when the editor closes, and drop a build request
     * still waiting for this editor.
     */
    detach(): void;
}

/** Connects the page editor to the admin assistant while the editor is open. */
export const PageEditorAssistantConnector = createAbstraction<IPageEditorAssistantConnector>(
    "WbAssistant/PageEditorAssistantConnector"
);

export namespace PageEditorAssistantConnector {
    export type Interface = IPageEditorAssistantConnector;
}
