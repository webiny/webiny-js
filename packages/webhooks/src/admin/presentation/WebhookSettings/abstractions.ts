import { createAbstraction } from "@webiny/feature/admin";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";

export interface IWebhookSettingsViewModel {
    loading: boolean;
    saving: boolean;
    form: IFormVM;
}

export interface IWebhookSettingsActions {
    save(): Promise<void>;
}

export interface IWebhookSettingsPresenter {
    vm: IWebhookSettingsViewModel;
    actions: IWebhookSettingsActions;
    init(): void;
}

export const WebhookSettingsPresenter = createAbstraction<IWebhookSettingsPresenter>(
    "WebhookSettingsPresenter"
);

export namespace WebhookSettingsPresenter {
    export type Interface = IWebhookSettingsPresenter;
    export type ViewModel = IWebhookSettingsViewModel;
    export type Actions = IWebhookSettingsActions;
}
