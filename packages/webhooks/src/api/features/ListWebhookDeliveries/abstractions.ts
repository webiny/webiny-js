import { createAbstraction, type Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { WebhookDelivery } from "~/api/domain/WebhookDelivery.js";
import type {
    WebhookPersistenceError,
    WebhookModelNotFoundError,
    WebhookNotAuthorizedError
} from "~/api/domain/errors.js";

export interface IListWebhookDeliveriesInput {
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

type IError = WebhookPersistenceError | WebhookModelNotFoundError | WebhookNotAuthorizedError;

export interface IListWebhookDeliveriesOutput {
    items: WebhookDelivery[];
    meta: IListMeta;
}

export interface IListWebhookDeliveriesUseCase {
    execute(
        input: IListWebhookDeliveriesInput
    ): Promise<Result<IListWebhookDeliveriesOutput, IError>>;
}

export const ListWebhookDeliveriesUseCase = createAbstraction<IListWebhookDeliveriesUseCase>(
    "Webhooks/ListWebhookDeliveriesUseCase"
);

export namespace ListWebhookDeliveriesUseCase {
    export type Interface = IListWebhookDeliveriesUseCase;
    export type Output = IListWebhookDeliveriesOutput;
    export type Error = IError;
}

export interface IListWebhookDeliveriesRepository {
    execute(
        input: IListWebhookDeliveriesInput
    ): Promise<Result<IListWebhookDeliveriesOutput, IError>>;
}

export const ListWebhookDeliveriesRepository = createAbstraction<IListWebhookDeliveriesRepository>(
    "Webhooks/ListWebhookDeliveriesRepository"
);

export namespace ListWebhookDeliveriesRepository {
    export type Interface = IListWebhookDeliveriesRepository;
    export type Error = IError;
}
