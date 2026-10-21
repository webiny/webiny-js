import { createAbstraction } from "@webiny/feature/admin";
import type { IFormModel, IFormVM } from "@webiny/app-admin";
import type { CreateLayoutData, Layout } from "~/features/layouts/index.js";

// ---------------------------------------------------------------------------
// Cross-cutting form modifier (e.g., Language field)
// ---------------------------------------------------------------------------

export interface ICreateLayoutFormModifier {
    modifyForm(form: IFormModel): void;
    mapFromForm?(data: Record<string, unknown>, input: CreateLayoutData): void;
}

export const CreateLayoutFormModifier = createAbstraction<ICreateLayoutFormModifier>(
    "CreateLayoutFormModifier"
);

export namespace CreateLayoutFormModifier {
    export type Interface = ICreateLayoutFormModifier;
}

// ---------------------------------------------------------------------------
// Presenter
// ---------------------------------------------------------------------------

export interface ICreateLayoutVm {
    /** `null` until `init()` builds it. */
    form: IFormVM | null;
    loading: boolean;
}

/**
 * The create layout dialog: a title, plus whatever the registered form modifiers add (the language).
 */
export interface ICreateLayoutPresenter {
    readonly vm: ICreateLayoutVm;
    // Start with an empty form.
    init(): void;
    // Resolves with the new layout, or `null` if the form is invalid or the layout could not be created.
    submit(): Promise<Layout | null>;
}

export const CreateLayoutPresenter =
    createAbstraction<ICreateLayoutPresenter>("CreateLayoutPresenter");

export namespace CreateLayoutPresenter {
    export type Interface = ICreateLayoutPresenter;
    export type ViewModel = ICreateLayoutVm;
}
