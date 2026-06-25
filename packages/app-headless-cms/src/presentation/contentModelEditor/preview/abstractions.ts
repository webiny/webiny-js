import { createAbstraction } from "@webiny/feature/admin";
import { FormModel } from "@webiny/app-admin";
import type { CmsModel } from "~/types.js";

export interface IContentModelFormPreviewViewModel {
    form: FormModel.FormVM | null;
}

export interface IContentModelFormPreviewPresenter {
    vm: IContentModelFormPreviewViewModel;
    buildForm(model: CmsModel): void;
    reset(): void;
}

export const ContentModelFormPreviewPresenter =
    createAbstraction<IContentModelFormPreviewPresenter>("ContentModelFormPreviewPresenter");

export namespace ContentModelFormPreviewPresenter {
    export type Interface = IContentModelFormPreviewPresenter;
    export type ViewModel = IContentModelFormPreviewViewModel;
}
