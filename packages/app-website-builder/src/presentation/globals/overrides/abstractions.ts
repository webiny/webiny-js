import type { EditorDocument } from "@webiny/website-builder-sdk";
import type { Editor } from "~/editorSdk/Editor.js";

// Where "Save changes" stores the changes of a global: in the open document only, or in the global itself.
export type GlobalSaveTarget = "document" | "global";

export interface IOverrideTargetVm {
    // A global component (placed in the document, or by its layout), or one of the layout's own elements.
    kind: "global" | "layoutElement";
    // E.g. "Global component · de", "Layout component · Site layout".
    title: string;
    description: string;
    // "page" or "layout": the open document, which can override the target's inputs.
    documentType: "page" | "layout";
    // The language a global is saved in: a language code, or "default".
    language: string;
    // A global's changes are saved on demand; a layout element's changes are saved with the page.
    hasChanges: boolean;
    saving: boolean;
    // Labels of the inputs the open document overrides on the edited element.
    overridden: string[];
    // A global's changes can be kept to this document: not when they add, remove or move its elements.
    canSaveToDocument: boolean;
    // A global's changes can be saved in the global itself: not if its stored record couldn't be loaded.
    canSaveToGlobal: boolean;
}

export interface IGlobalComponentsVm {
    target: IOverrideTargetVm | null;
}

/**
 * Global components, and in the page editor the layout's own elements, in the open document. Their
 * effective values are composed into the document from their layers (see `OverrideLayers`), so they
 * render and edit like any other element. A global's changes are saved on demand, as an override in
 * the open document or in the global itself; a layout element's changes are the page's overrides.
 */
export interface IGlobalComponentsPresenter {
    readonly vm: IGlobalComponentsVm;
    /**
     * Track the document open in the editor: offer globals in the Insert panel (a drop places the global
     * once more), and give every registered global its instance. Returns a function that stops it.
     */
    init<TDocument extends EditorDocument>(editor: Editor<TDocument>): () => void;
    save(target: GlobalSaveTarget): Promise<void>;
    // Restore the selected global to what's saved.
    discard(): void;
    // Remove the open document's overrides of the selected global or layout element.
    resetOverrides(): void;
    // The document as it's stored: without global instances, and with only its overrides of others.
    toStoredDocument<T extends EditorDocument>(document: T): T;
    // Called when the document's overrides change outside of its own edits, so it's saved.
    onOverridesChange(listener: () => void): () => void;
}

export namespace GlobalComponentsPresenter {
    export type Interface = IGlobalComponentsPresenter;
    export type ViewModel = IGlobalComponentsVm;
    export type TargetViewModel = IOverrideTargetVm;
    export type SaveTarget = GlobalSaveTarget;
}
