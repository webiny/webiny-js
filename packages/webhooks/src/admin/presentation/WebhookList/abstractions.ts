import { createAbstraction } from "@webiny/feature/admin";
import type { Webhook } from "~/admin/shared/types.js";
import type { IListViewModel } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";

export interface IWebhookListViewModel {
    list: IListViewModel<Webhook>;
    permissions: {
        canRead: boolean;
        canCreate: boolean;
        canEdit: boolean;
        canDelete: boolean;
    };
}

export interface IWebhookListPresenter {
    vm: IWebhookListViewModel;
    init(): void;
    search: { set(query: string): void; clear(): void };
    sort: { set(field: string, direction: "ASC" | "DESC"): void; toggle(field: string): void };
    filter: { set(key: string, value: unknown): void; clear(key: string): void; clearAll(): void };
    selection: {
        toggle(id: string): void;
        selectRangeTo(id: string): void;
        selectAll(): void;
        deselectAll(): void;
        selectRows(ids: string[]): void;
        isSelected(id: string): boolean;
    };
    loadMore(): Promise<void>;
    refresh(): Promise<void>;
    deleteWebhook(id: string): Promise<void>;
    triggerWebhook(id: string): Promise<void>;
}

export const WebhookListPresenter =
    createAbstraction<IWebhookListPresenter>("WebhookListPresenter");

export namespace WebhookListPresenter {
    export type Interface = IWebhookListPresenter;
    export type ViewModel = IWebhookListViewModel;
}
