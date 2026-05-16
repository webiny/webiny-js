import { createAbstraction } from "@webiny/feature/admin";
import type { IWebhook } from "~/admin/domain/types.js";

export interface IWebhooksListVm {
    loading: boolean;
    error: string | null;
    items: IWebhook[];
    totalCount: number;
}

export interface IWebhooksListPresenter {
    vm: IWebhooksListVm;
    load(): Promise<void>;
}

export const WebhooksListPresenter =
    createAbstraction<IWebhooksListPresenter>("WebhooksListPresenter");

export namespace WebhooksListPresenter {
    export type Interface = IWebhooksListPresenter;
    export type ViewModel = IWebhooksListVm;
}
