import { createAbstraction } from "@webiny/feature/admin";
import type { Webhook } from "~/admin/shared/types.js";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";

export interface IWebhookFormViewModel {
    loading: boolean;
    saving: boolean;
    isNew: boolean;
    webhook: Webhook | null;
    showDeliveries: boolean;
    permissions: {
        canEdit: boolean;
        canDelete: boolean;
    };
    form: IFormVM;
}

export interface IWebhookFormActions {
    save(): Promise<void>;
    deleteWebhook(): Promise<void>;
    openDeliveries(): void;
    closeDeliveries(): void;
}

export interface IWebhookFormPresenter {
    vm: IWebhookFormViewModel;
    actions: IWebhookFormActions;
    init(id: string): void;
}

export const WebhookFormPresenter =
    createAbstraction<IWebhookFormPresenter>("WebhookFormPresenter");

export namespace WebhookFormPresenter {
    export type Interface = IWebhookFormPresenter;
    export type ViewModel = IWebhookFormViewModel;
    export type Actions = IWebhookFormActions;
}
