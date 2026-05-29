import { createAbstraction } from "@webiny/feature/admin";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import type { IListViewModel } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";

export interface IDeliveryPageFilters {
    webhookId: string | null;
    app: string | null;
    entity: string | null;
    eventName: string | null;
    status: string[];
}

export interface IDeliveryFilterOption {
    value: string;
    label: string;
}

export interface IWebhookDeliveriesPageViewModel {
    availableWebhooks: IDeliveryFilterOption[];
    availableApps: IDeliveryFilterOption[];
    availableEntities: IDeliveryFilterOption[];
    availableEventNames: IDeliveryFilterOption[];
    filters: IDeliveryPageFilters;
    list: IListViewModel<WebhookDelivery>;
    resendingIds: Set<string>;
    hasFilters: boolean;
    loading: boolean;
    error: string | null;
}

export interface IWebhookDeliveriesPagePresenter {
    vm: IWebhookDeliveriesPageViewModel;
    init(webhookId?: string): Promise<void>;
    setWebhookFilter(webhookId: string | null): void;
    setAppFilter(app: string | null): void;
    setEntityFilter(entity: string | null): void;
    setEventFilter(eventName: string | null): void;
    setStatusFilter(status: string[]): void;
    clearFilters(): void;
    loadMore(): Promise<void>;
    resend(id: string): Promise<void>;
}

export const WebhookDeliveriesPagePresenter = createAbstraction<IWebhookDeliveriesPagePresenter>(
    "WebhookDeliveriesPagePresenter"
);

export namespace WebhookDeliveriesPagePresenter {
    export type Interface = IWebhookDeliveriesPagePresenter;
    export type ViewModel = IWebhookDeliveriesPageViewModel;
}
