import { createAbstraction } from "@webiny/feature/admin";
import type { Webhook } from "~/admin/shared/types.js";
import type { IListViewModel } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import type { IListActions } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";

export interface IWebhookListViewModel {
    list: IListViewModel<Webhook>;
    permissions: {
        canRead: boolean;
        canCreate: boolean;
        canEdit: boolean;
        canDelete: boolean;
    };
}

export interface IWebhookListActions extends IListActions {
    deleteWebhook(id: string): Promise<void>;
    triggerWebhook(id: string): Promise<void>;
}

export interface IWebhookListPresenter {
    vm: IWebhookListViewModel;
    actions: IWebhookListActions;
    init(): void;
}

export const WebhookListPresenter =
    createAbstraction<IWebhookListPresenter>("WebhookListPresenter");

export namespace WebhookListPresenter {
    export type Interface = IWebhookListPresenter;
    export type ViewModel = IWebhookListViewModel;
    export type Actions = IWebhookListActions;
}
