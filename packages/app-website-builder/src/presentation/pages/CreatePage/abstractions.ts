import { createAbstraction } from "@webiny/feature/admin";
import type { IFormModel, IFormVM } from "@webiny/app-admin";
import type { CreatePageParams } from "~/features/pages/createPage/abstractions.js";

// ---------------------------------------------------------------------------
// Page Type — each registered implementation defines a page type
// ---------------------------------------------------------------------------

export interface IPageType {
    name: string;
    label: string;
    description?: string;
    modifyForm(form: IFormModel): void;
    mapFormData?(data: Record<string, unknown>, input: CreatePageParams): void;
}

export const PageType = createAbstraction<IPageType>("PageType");

export namespace PageType {
    export type Interface = IPageType;
}

// ---------------------------------------------------------------------------
// Cross-cutting form modifier (e.g., Language field)
// ---------------------------------------------------------------------------

export interface ICreatePageFormModifier {
    modifyForm(form: IFormModel): void;
    mapFormData?(data: Record<string, unknown>, input: CreatePageParams): void;
}

export const CreatePageFormModifier =
    createAbstraction<ICreatePageFormModifier>("CreatePageFormModifier");

export namespace CreatePageFormModifier {
    export type Interface = ICreatePageFormModifier;
}

// ---------------------------------------------------------------------------
// Presenter
// ---------------------------------------------------------------------------

export interface IPageTypeOption {
    name: string;
    label: string;
}

export interface ICreatePageVm {
    form: IFormVM;
    pageTypes: IPageTypeOption[];
    selectedPageType: string;
}

export interface ICreatePagePresenter {
    readonly vm: ICreatePageVm;
    init(pageType: string, folderId: string): void;
    submit(): Promise<CreatePageParams | false>;
}

export const CreatePagePresenter = createAbstraction<ICreatePagePresenter>("CreatePagePresenter");

export namespace CreatePagePresenter {
    export type Interface = ICreatePagePresenter;
    export type ViewModel = ICreatePageVm;
    export type PageTypeOption = IPageTypeOption;
}
