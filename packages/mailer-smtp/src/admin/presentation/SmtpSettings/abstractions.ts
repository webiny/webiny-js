import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { MailerSettingsSource } from "~/admin/types.js";

export interface ISmtpSettingsViewModel {
    loading: boolean;
    saving: boolean;
    form: IFormVM;
    source: MailerSettingsSource;
    editable: boolean;
    /** A test email is sending; saving now would pin its result on the new settings. */
    testMailSending: boolean;
}

export interface ISmtpSettingsPresenter {
    vm: ISmtpSettingsViewModel;
    load(): Promise<void>;
    save(): Promise<boolean>;
}

export const SmtpSettingsPresenter = createAbstraction<ISmtpSettingsPresenter>(
    "MailerSmtp/SmtpSettingsPresenter"
);

export namespace SmtpSettingsPresenter {
    export type Interface = ISmtpSettingsPresenter;
    export type ViewModel = ISmtpSettingsViewModel;
}
