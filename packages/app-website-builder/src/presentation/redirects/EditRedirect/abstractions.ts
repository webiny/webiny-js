import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { RedirectDto } from "~/domain/Redirect/RedirectDto.js";

export interface IEditRedirectViewModel {
    redirect: RedirectDto | null;
    loading: string | null;
    form: IFormVM;
}

export interface IEditRedirectPresenter {
    vm: IEditRedirectViewModel;
    loadRedirect(redirectId: string): Promise<void>;
    save(): Promise<boolean>;
}

export const EditRedirectPresenter = createAbstraction<IEditRedirectPresenter>(
    "WebsiteBuilder/EditRedirectPresenter"
);

export namespace EditRedirectPresenter {
    export type Interface = IEditRedirectPresenter;
    export type ViewModel = IEditRedirectViewModel;
}
