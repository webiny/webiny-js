import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";

export interface IWebhookSettingsViewModel {
    loading: boolean;
    saving: boolean;
    /* Set when the settings could not be loaded, e.g. the user is not allowed to see them. */
    error: string | null;
    form: IFormVM;
}

export interface IWebhookSettingsPresenter {
    vm: IWebhookSettingsViewModel;
    save(): Promise<boolean>;
    init(): void;
    generateSigningSecret(): void;
    getSigningSecret(): string;
}

export const WebhookSettingsPresenter = createAbstraction<IWebhookSettingsPresenter>(
    "WebhookSettingsPresenter"
);

export namespace WebhookSettingsPresenter {
    export type Interface = IWebhookSettingsPresenter;
    export type ViewModel = IWebhookSettingsViewModel;
}
