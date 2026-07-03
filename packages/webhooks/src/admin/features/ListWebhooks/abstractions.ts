import { createAbstraction } from "@webiny/feature/admin";
import type { Webhook } from "~/admin/shared/types.js";

export interface IListWebhooksInput {
    where?: Record<string, unknown>;
    sort?: string[];
    limit?: number;
    after?: string;
}

export interface IListWebhooksMeta {
    cursor: string | null;
    hasMoreItems: boolean;
    totalCount: number;
}

export interface IListWebhooksOutput {
    items: Webhook[];
    meta: IListWebhooksMeta;
}

export interface IListWebhooksGateway {
    execute(input: IListWebhooksInput): Promise<IListWebhooksOutput>;
}

export const ListWebhooksGateway = createAbstraction<IListWebhooksGateway>("ListWebhooksGateway");

export namespace ListWebhooksGateway {
    export type Interface = IListWebhooksGateway;
}

export interface IListWebhooksRepository {
    execute(input: IListWebhooksInput): Promise<IListWebhooksOutput>;
}

export const ListWebhooksRepository =
    createAbstraction<IListWebhooksRepository>("ListWebhooksRepository");

export namespace ListWebhooksRepository {
    export type Interface = IListWebhooksRepository;
}

export interface IListWebhooksUseCase {
    execute(input: IListWebhooksInput): Promise<IListWebhooksOutput>;
}

export const ListWebhooksUseCase = createAbstraction<IListWebhooksUseCase>("ListWebhooksUseCase");

export namespace ListWebhooksUseCase {
    export type Interface = IListWebhooksUseCase;
}
