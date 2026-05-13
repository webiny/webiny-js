import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IWebhookDelivery } from "~/api/domain/types.js";
import type {
    WebhookNotFoundError,
    WebhookPersistenceError,
    WebhookModelNotFoundError,
    WebhookNotAuthorizedError
} from "~/api/domain/errors.js";

type IError =
    | WebhookNotFoundError
    | WebhookPersistenceError
    | WebhookModelNotFoundError
    | WebhookNotAuthorizedError;

export interface ITriggerWebhookUseCase {
    execute(
        webhookId: string,
        payload: Record<string, unknown>
    ): Promise<Result<IWebhookDelivery, IError>>;
}

export const TriggerWebhookUseCase = createAbstraction<ITriggerWebhookUseCase>(
    "Webhooks/TriggerWebhookUseCase"
);

export namespace TriggerWebhookUseCase {
    export type Interface = ITriggerWebhookUseCase;
    export type Error = IError;
}
