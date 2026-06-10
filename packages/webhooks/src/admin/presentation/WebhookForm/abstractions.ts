import { createAbstraction } from "@webiny/feature/admin";
import type { Webhook } from "~/admin/shared/types.js";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";

export interface IWebhookFormViewModel {
    loading: boolean;
    saving: boolean;
    isNew: boolean;
    webhook: Webhook | null;
    permissions: {
        canEdit: boolean;
        canDelete: boolean;
    };
    form: IFormVM;
}

export interface IWebhookFormPresenter {
    vm: IWebhookFormViewModel;
    init(id: string): void;
    save(): Promise<boolean>;
    deleteWebhook(): Promise<void>;
}

export const WebhookFormPresenter =
    createAbstraction<IWebhookFormPresenter>("WebhookFormPresenter");

export namespace WebhookFormPresenter {
    export type Interface = IWebhookFormPresenter;
    export type ViewModel = IWebhookFormViewModel;
}
