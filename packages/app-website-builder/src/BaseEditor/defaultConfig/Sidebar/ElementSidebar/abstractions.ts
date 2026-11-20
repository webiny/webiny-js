import { createAbstraction } from "@webiny/feature/admin";
import type { EditorDocument } from "@webiny/website-builder-sdk";
import type { Editor } from "~/editorSdk/Editor.js";

export interface IElementSettingsInput {
    name: string;
    label: string;
}

export interface IElementSettingsVm {
    elementId: string;
    /**
     * In the page editor, one of the layout's content areas, with its name (`null` for a named area without
     * one). It belongs to the layout, so a page can't rename it: the description is shown in place of inputs.
     */
    layoutArea: { name: string | null; description: string } | null;
    // A note above the inputs: that the element has none.
    message: string | null;
    // The inputs that can be edited (slots are filled on the canvas). None for a layout's content area.
    inputs: IElementSettingsInput[];
}

export interface IElementSidebarElementVm {
    // The selected element.
    id: string;
    componentName: string;
    actions: {
        delete: boolean;
        clone: boolean;
    };
    // What the sidebar edits: the selected element's settings, or, for a placement of a global, its instance's.
    settings: IElementSettingsVm | null;
}

export interface IElementSidebarVm {
    // `null` when no element is selected.
    element: IElementSidebarElementVm | null;
}

/**
 * The sidebar of the selected element: which actions it offers, and what its settings show.
 */
export interface IElementSidebarPresenter {
    readonly vm: IElementSidebarVm;
    init(editor: Editor<EditorDocument>): void;
    // What the settings of one element show: the edited element's, or one an embedding editor shows.
    getSettings(elementId: string): IElementSettingsVm;
    deleteElement(): void;
    cloneElement(): void;
}

export const ElementSidebarPresenter = createAbstraction<IElementSidebarPresenter>(
    "BaseEditor/ElementSidebarPresenter"
);

export namespace ElementSidebarPresenter {
    export type Interface = IElementSidebarPresenter;
    export type ViewModel = IElementSidebarVm;
    export type ElementViewModel = IElementSidebarElementVm;
    export type SettingsViewModel = IElementSettingsVm;
}
