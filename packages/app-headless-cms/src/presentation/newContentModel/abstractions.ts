import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModel } from "~/types.js";

export interface INewContentModelPresenterViewModel {
    loading: boolean;
    saving: boolean;
    groups: { value: string; label: string }[];
    models: CmsModel[];
    form: IFormVM;
}

export interface INewContentModelPresenter {
    readonly vm: INewContentModelPresenterViewModel;
    init(): void;
    save(): Promise<CmsModel | null>;
    reset(): void;
}

export const NewContentModelPresenter = createAbstraction<INewContentModelPresenter>(
    "CmsNewContentModel/Presenter"
);

export namespace NewContentModelPresenter {
    export type Interface = INewContentModelPresenter;
    export type ViewModel = INewContentModelPresenterViewModel;
}
