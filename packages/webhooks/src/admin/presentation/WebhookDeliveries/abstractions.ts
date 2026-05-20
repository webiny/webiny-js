import { createAbstraction } from "@webiny/feature/admin";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import type {
    IListViewModel,
    IListActions
} from "@webiny/app-admin/presentation/listPresenter/abstractions.js";

export interface IWebhookDeliveriesViewModel {
    list: IListViewModel<WebhookDelivery>;
    selectedDelivery: WebhookDelivery | null;
}

export interface IWebhookDeliveriesActions extends IListActions {
    resend(id: string): Promise<void>;
    selectDelivery(delivery: WebhookDelivery | null): void;
}

export interface IWebhookDeliveriesPresenter {
    vm: IWebhookDeliveriesViewModel;
    actions: IWebhookDeliveriesActions;
    init(webhookId: string): void;
}

export const WebhookDeliveriesPresenter = createAbstraction<IWebhookDeliveriesPresenter>(
    "WebhookDeliveriesPresenter"
);

export namespace WebhookDeliveriesPresenter {
    export type Interface = IWebhookDeliveriesPresenter;
    export type ViewModel = IWebhookDeliveriesViewModel;
    export type Actions = IWebhookDeliveriesActions;
}
