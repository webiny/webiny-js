import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";

export interface IWebhookSettingsViewModel {
    loading: boolean;
    saving: boolean;
    form: IFormVM;
}

export interface IWebhookSettingsPresenter {
    vm: IWebhookSettingsViewModel;
    save(): Promise<boolean>;
    init(): void;
}

export const WebhookSettingsPresenter = createAbstraction<IWebhookSettingsPresenter>(
    "WebhookSettingsPresenter"
);

export namespace WebhookSettingsPresenter {
    export type Interface = IWebhookSettingsPresenter;
    export type ViewModel = IWebhookSettingsViewModel;
}
