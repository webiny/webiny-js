import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";

export interface ICreateRedirectViewModel {
    loading: string | null;
    form: IFormVM;
}

export interface ICreateRedirectPresenter {
    vm: ICreateRedirectViewModel;
    init(folderId: string): void;
    save(): Promise<boolean>;
}

export const CreateRedirectPresenter = createAbstraction<ICreateRedirectPresenter>(
    "WebsiteBuilder/CreateRedirectPresenter"
);

export namespace CreateRedirectPresenter {
    export type Interface = ICreateRedirectPresenter;
    export type ViewModel = ICreateRedirectViewModel;
}
