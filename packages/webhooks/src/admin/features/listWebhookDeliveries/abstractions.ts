import { createAbstraction } from "@webiny/feature/admin";
import type { WebhookDelivery } from "~/admin/shared/types.js";

export interface ListWebhookDeliveriesParams {
    webhookId: string;
    limit?: number;
    after?: string;
}

export interface ListWebhookDeliveriesResult {
    data: WebhookDelivery[];
    meta: {
        cursor: string | null;
        hasMoreItems: boolean;
        totalCount: number;
    };
}

export interface IListWebhookDeliveriesGateway {
    execute(params: ListWebhookDeliveriesParams): Promise<ListWebhookDeliveriesResult>;
}

export const ListWebhookDeliveriesGateway = createAbstraction<IListWebhookDeliveriesGateway>(
    "ListWebhookDeliveriesGateway"
);

export namespace ListWebhookDeliveriesGateway {
    export type Interface = IListWebhookDeliveriesGateway;
}

export interface IListWebhookDeliveriesUseCase {
    execute(params: ListWebhookDeliveriesParams): Promise<ListWebhookDeliveriesResult>;
}

export const ListWebhookDeliveriesUseCase = createAbstraction<IListWebhookDeliveriesUseCase>(
    "ListWebhookDeliveriesUseCase"
);

export namespace ListWebhookDeliveriesUseCase {
    export type Interface = IListWebhookDeliveriesUseCase;
}
