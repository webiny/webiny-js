import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { MailerSettingsSource } from "~/types.js";

export interface ISettingsViewModel {
    loading: boolean;
    saving: boolean;
    form: IFormVM;
    source: MailerSettingsSource;
    editable: boolean;
}

export interface ISettingsPresenter {
    vm: ISettingsViewModel;
    load(): Promise<void>;
    save(): Promise<boolean>;
}

export const SettingsPresenter = createAbstraction<ISettingsPresenter>("Mailer/SettingsPresenter");

export namespace SettingsPresenter {
    export type Interface = ISettingsPresenter;
    export type ViewModel = ISettingsViewModel;
}
