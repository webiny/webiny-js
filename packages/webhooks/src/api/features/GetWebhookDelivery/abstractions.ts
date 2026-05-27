import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WebhookDelivery } from "~/api/domain/WebhookDelivery.js";
import type {
    WebhookDeliveryNotFoundError,
    WebhookPersistenceError,
    WebhookModelNotFoundError,
    WebhookNotAuthorizedError,
    WebhookValidationError
} from "~/api/domain/errors.js";

type IError =
    | WebhookDeliveryNotFoundError
    | WebhookPersistenceError
    | WebhookModelNotFoundError
    | WebhookNotAuthorizedError
    | WebhookValidationError;

export interface IGetWebhookDeliveryUseCase {
    execute(id: string): Promise<Result<WebhookDelivery, IError>>;
}

export const GetWebhookDeliveryUseCase = createAbstraction<IGetWebhookDeliveryUseCase>(
    "Webhooks/GetWebhookDeliveryUseCase"
);

export namespace GetWebhookDeliveryUseCase {
    export type Interface = IGetWebhookDeliveryUseCase;
    export type Error = IError;
}

export interface IGetWebhookDeliveryRepository {
    execute(id: string): Promise<Result<WebhookDelivery, IError>>;
}

export const GetWebhookDeliveryRepository = createAbstraction<IGetWebhookDeliveryRepository>(
    "Webhooks/GetWebhookDeliveryRepository"
);

export namespace GetWebhookDeliveryRepository {
    export type Interface = IGetWebhookDeliveryRepository;
    export type Error = IError;
}
