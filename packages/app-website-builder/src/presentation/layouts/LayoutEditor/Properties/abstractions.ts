import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin";
import type { Layout } from "~/features/layouts/index.js";

export interface ILayoutPropertiesInit {
    // The revision being edited.
    id: string;
    title: string;
    slug: string | null;
    // A language version is named by its source's slug: it has none of its own.
    isLanguageVersion: boolean;
}

export interface ILayoutPropertiesVm {
    /** `null` until `init()` builds it. */
    form: IFormVM | null;
    saving: boolean;
}

/**
 * The layout editor's "Layout settings": the layout's title and slug, saved on their own, outside autosave, so
 * a slug another layout has is reported here.
 */
export interface ILayoutPropertiesPresenter {
    readonly vm: ILayoutPropertiesVm;
    init(params: ILayoutPropertiesInit): void;
    // Resolves with the saved layout, or `null` if the form is invalid or it could not be saved.
    submit(): Promise<Layout | null>;
}

export const LayoutPropertiesPresenter = createAbstraction<ILayoutPropertiesPresenter>(
    "LayoutPropertiesPresenter"
);

export namespace LayoutPropertiesPresenter {
    export type Interface = ILayoutPropertiesPresenter;
    export type ViewModel = ILayoutPropertiesVm;
    export type Init = ILayoutPropertiesInit;
}
