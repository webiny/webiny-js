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

/** One choice in a prompt context picker. */
export interface PromptContextOption {
    id: string;
    name: string;
    /** A line under the name: a project's description, a persona's. */
    description?: string;
}

/** A file attached for the assistant to read. */
export interface PromptContextFile {
    id: string;
    name: string;
}

export interface IPromptContextViewModel {
    /** Empty until the settings load, and when none are set up. A kind with none shows no picker. */
    projects: PromptContextOption[];
    readerPersonas: PromptContextOption[];
    writerPersonas: PromptContextOption[];
    project: PromptContextOption | null;
    readerPersona: PromptContextOption | null;
    writerPersona: PromptContextOption | null;
    files: PromptContextFile[];
}

/**
 * Which project, reader persona and writer persona the assistant writes for in the page editor, and
 * the files attached for it, chosen once for the chat.
 */
export interface IPromptContextPresenter {
    readonly vm: IPromptContextViewModel;
    /** Read the presets from the AI Power-Ups settings. */
    load(): Promise<void>;
    /** Choosing a project also chooses its default personas. */
    setProject(id: string | null): void;
    setReaderPersona(id: string | null): void;
    setWriterPersona(id: string | null): void;
    /** Attach files. One already attached is not added twice. */
    attachFiles(files: PromptContextFile[]): void;
    removeFile(id: string): void;
    /** What the request carries, as the server's `promptContext` control reads it. */
    value(): Record<string, unknown> | undefined;
}

export const PromptContextPresenter = createAbstraction<IPromptContextPresenter>(
    "WbAssistant/PromptContextPresenter"
);

export namespace PromptContextPresenter {
    export type Interface = IPromptContextPresenter;
    export type ViewModel = IPromptContextViewModel;
    export type Option = PromptContextOption;
    export type File = PromptContextFile;
}
