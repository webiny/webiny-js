import { createAbstraction } from "@webiny/feature/admin";
import type { ComponentManifest, EditorDocument } from "@webiny/website-builder-sdk";
import type { Editor } from "~/editorSdk/Editor.js";

export type InsertElementsView = "list" | "grid";

export interface IInsertElementsGroupVm {
    name: string;
    label: string;
    // An SVG shown next to the label. Without one, a default icon is shown.
    icon: string | undefined;
    items: ComponentManifest[];
}

export interface IInsertElementsVm {
    search: string;
    view: InsertElementsView;
    // The groups with components matching the search: a group without any is left out.
    groups: IInsertElementsGroupVm[];
}

/**
 * The editor's Insert panel: the components that can be inserted into the open document, by group.
 * Globals are listed in their own group; named content areas are offered in a layout only.
 */
export interface IInsertElementsPresenter {
    readonly vm: IInsertElementsVm;
    // List the components of the document open in the editor. Returns a function that stops it.
    init<TDocument extends EditorDocument>(editor: Editor<TDocument>): () => void;
    setSearch(search: string): void;
    setView(view: InsertElementsView): void;
}

export const InsertElementsPresenter = createAbstraction<IInsertElementsPresenter>(
    "Editor/InsertElementsPresenter"
);

export namespace InsertElementsPresenter {
    export type Interface = IInsertElementsPresenter;
    export type ViewModel = IInsertElementsVm;
    export type GroupViewModel = IInsertElementsGroupVm;
    export type View = InsertElementsView;
}
