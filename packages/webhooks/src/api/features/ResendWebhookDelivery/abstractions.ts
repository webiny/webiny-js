import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    WebhookDeliveryNotFoundError,
    WebhookNotFoundError,
    WebhookPersistenceError,
    WebhookModelNotFoundError,
    WebhookNotAuthorizedError
} from "~/api/domain/errors.js";

type IError =
    | WebhookDeliveryNotFoundError
    | WebhookNotFoundError
    | WebhookPersistenceError
    | WebhookModelNotFoundError
    | WebhookNotAuthorizedError;

export interface IResendWebhookDeliveryUseCase {
    execute(deliveryId: string): Promise<Result<boolean, IError>>;
}

export const ResendWebhookDeliveryUseCase = createAbstraction<IResendWebhookDeliveryUseCase>(
    "Webhooks/ResendWebhookDeliveryUseCase"
);

export namespace ResendWebhookDeliveryUseCase {
    export type Interface = IResendWebhookDeliveryUseCase;
    export type Error = IError;
}
