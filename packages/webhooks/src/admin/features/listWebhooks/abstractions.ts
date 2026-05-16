import { createAbstraction } from "@webiny/feature/admin";
import type { Webhook } from "~/admin/shared/types.js";

export interface ListWebhooksGatewayParams {
    where?: { enabled?: boolean };
    limit?: number;
    after?: string;
}

export interface ListWebhooksGatewayResult {
    data: Webhook[];
    meta: {
        cursor: string | null;
        hasMoreItems: boolean;
        totalCount: number;
    };
}

export interface IListWebhooksGateway {
    execute(params: ListWebhooksGatewayParams): Promise<ListWebhooksGatewayResult>;
}

export const ListWebhooksGateway = createAbstraction<IListWebhooksGateway>("ListWebhooksGateway");

export namespace ListWebhooksGateway {
    export type Interface = IListWebhooksGateway;
}

export interface IListWebhooksUseCase {
    execute(params: ListWebhooksGatewayParams): Promise<ListWebhooksGatewayResult>;
}

export const ListWebhooksUseCase = createAbstraction<IListWebhooksUseCase>("ListWebhooksUseCase");

export namespace ListWebhooksUseCase {
    export type Interface = IListWebhooksUseCase;
}
