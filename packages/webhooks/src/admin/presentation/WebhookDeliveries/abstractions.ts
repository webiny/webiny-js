import { createAbstraction } from "@webiny/feature/admin";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import type { IListViewModel } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";

export interface IWebhookDeliveriesViewModel {
    list: IListViewModel<WebhookDelivery>;
    selectedDelivery: WebhookDelivery | null;
}

export interface IWebhookDeliveriesPresenter {
    vm: IWebhookDeliveriesViewModel;
    init(webhookId: string): void;
    loadMore(): Promise<void>;
    resend(id: string): Promise<void>;
    selectDelivery(delivery: WebhookDelivery | null): void;
}

export const WebhookDeliveriesPresenter = createAbstraction<IWebhookDeliveriesPresenter>(
    "WebhookDeliveriesPresenter"
);

export namespace WebhookDeliveriesPresenter {
    export type Interface = IWebhookDeliveriesPresenter;
    export type ViewModel = IWebhookDeliveriesViewModel;
}
