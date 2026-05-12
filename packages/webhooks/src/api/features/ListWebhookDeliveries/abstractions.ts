import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    IWebhookDelivery,
    IListWebhookDeliveriesInput,
    IListMeta
} from "~/api/domain/types.js";
import type { WebhookPersistenceError, WebhookModelNotFoundError } from "~/api/domain/errors.js";

type IError = WebhookPersistenceError | WebhookModelNotFoundError;

export interface IListWebhookDeliveriesOutput {
    items: IWebhookDelivery[];
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
