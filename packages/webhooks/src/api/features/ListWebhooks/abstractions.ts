import { type Result, BaseError, createAbstraction } from "@webiny/feature/api";
import type { IWebhook, IListMeta, IListWebhooksInput } from "~/api/domain/types.js";

export interface IListWebhooksRepository {
    execute(
        input: IListWebhooksInput
    ): Promise<Result<{ items: IWebhook[]; meta: IListMeta }, BaseError>>;
}

export const ListWebhooksRepository = createAbstraction<IListWebhooksRepository>(
    "Webhooks/ListWebhooksRepository"
);

export namespace ListWebhooksRepository {
    export type Interface = IListWebhooksRepository;
}
