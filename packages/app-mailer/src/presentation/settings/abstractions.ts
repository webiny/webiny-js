import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { MailerSettingsSource } from "~/types.js";

export interface ITestMailResult {
    type: "success" | "danger";
    message: string;
}

export interface ITestMailViewModel {
    recipient: string;
    sending: boolean;
    /** Why the test cannot run right now, or null when it can. */
    disabledReason: string | null;
    result: ITestMailResult | null;
}

export interface ISettingsViewModel {
    loading: boolean;
    saving: boolean;
    form: IFormVM;
    source: MailerSettingsSource;
    editable: boolean;
    testMail: ITestMailViewModel;
}

export interface ISettingsPresenter {
    vm: ISettingsViewModel;
    load(): Promise<void>;
    save(): Promise<boolean>;
    setTestMailRecipient(recipient: string): void;
    sendTestMail(): Promise<void>;
}

export const SettingsPresenter = createAbstraction<ISettingsPresenter>("Mailer/SettingsPresenter");

export namespace SettingsPresenter {
    export type Interface = ISettingsPresenter;
    export type ViewModel = ISettingsViewModel;
}
