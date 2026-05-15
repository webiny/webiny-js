import { createAbstraction, type Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { Webhook } from "~/api/domain/Webhook.js";
import type {
    WebhookModelNotFoundError,
    WebhookPersistenceError,
    WebhookNotAuthorizedError
} from "~/api/domain/errors.js";

export interface IListWebhooksInput {
    where?: GenericRecord;
    limit?: number;
    after?: string;
    sort?: (`${string}_ASC` | `${string}_DESC`)[];
}

export interface IListMeta {
    cursor: string | null;
    hasMoreItems: boolean;
    totalCount: number;
}

type IError = WebhookModelNotFoundError | WebhookPersistenceError | WebhookNotAuthorizedError;

export interface IListWebhooksOutput {
    items: Webhook[];
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
