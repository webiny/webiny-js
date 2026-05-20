import { createAbstraction } from "@webiny/feature/admin";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import type { IListViewModel } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";

export interface IDeliveryPageFilters {
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
    availableApps: IDeliveryFilterOption[];
    availableEntities: IDeliveryFilterOption[];
    availableEventNames: IDeliveryFilterOption[];
    filters: IDeliveryPageFilters;
    list: IListViewModel<WebhookDelivery>;
    expandedDeliveryId: string | null;
    loading: boolean;
    error: string | null;
}

export interface IWebhookDeliveriesPageActions {
    init(): Promise<void>;
    setAppFilter(app: string | null): void;
    setEntityFilter(entity: string | null): void;
    setEventFilter(eventName: string | null): void;
    setStatusFilter(status: string[]): void;
    expandDelivery(id: string | null): void;
    loadMore(): Promise<void>;
    resend(id: string): Promise<void>;
}

export interface IWebhookDeliveriesPagePresenter {
    vm: IWebhookDeliveriesPageViewModel;
    actions: IWebhookDeliveriesPageActions;
}

export const WebhookDeliveriesPagePresenter = createAbstraction<IWebhookDeliveriesPagePresenter>(
    "WebhookDeliveriesPagePresenter"
);

export namespace WebhookDeliveriesPagePresenter {
    export type Interface = IWebhookDeliveriesPagePresenter;
    export type ViewModel = IWebhookDeliveriesPageViewModel;
    export type Actions = IWebhookDeliveriesPageActions;
}
