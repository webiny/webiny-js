import { createAbstraction } from "@webiny/feature/admin";
import type { IListWebhooksInput, IListWebhooksOutput } from "~/admin/domain/types.js";

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
