import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IWebhook, IListMeta, IListWebhooksInput } from "~/api/domain/types.js";
import type { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";

type IError = WebhookModelNotFoundError | WebhookPersistenceError;

export interface IListWebhooksOutput {
    items: IWebhook[];
    meta: IListMeta;
}

export interface IListWebhooksUseCase {
    execute(input?: IListWebhooksInput): Promise<Result<IListWebhooksOutput, IError>>;
}

export const ListWebhooksUseCase = createAbstraction<IListWebhooksUseCase>(
    "Webhooks/ListWebhooksUseCase"
);

export namespace ListWebhooksUseCase {
    export type Interface = IListWebhooksUseCase;
    export type Output = IListWebhooksOutput;
    export type Error = IError;
}

export interface IListWebhooksRepository {
    execute(input?: IListWebhooksInput): Promise<Result<IListWebhooksOutput, IError>>;
}

export const ListWebhooksRepository = createAbstraction<IListWebhooksRepository>(
    "Webhooks/ListWebhooksRepository"
);

export namespace ListWebhooksRepository {
    export type Interface = IListWebhooksRepository;
    export type Output = IListWebhooksOutput;
    export type Error = IError;
}
