import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Webhook } from "~/api/domain/Webhook.js";
import type {
    WebhookNotFoundError,
    WebhookModelNotFoundError,
    WebhookPersistenceError,
    WebhookNotAuthorizedError
} from "~/api/domain/errors.js";

type IError =
    | WebhookNotFoundError
    | WebhookModelNotFoundError
    | WebhookPersistenceError
    | WebhookNotAuthorizedError;

export interface IGetWebhookUseCase {
    execute(id: string): Promise<Result<Webhook, IError>>;
}

export const GetWebhookUseCase = createAbstraction<IGetWebhookUseCase>(
    "Webhooks/GetWebhookUseCase"
);

export namespace GetWebhookUseCase {
    export type Interface = IGetWebhookUseCase;
    export type Error = IError;
}

export interface IGetWebhookRepository {
    execute(id: string): Promise<Result<Webhook, IError>>;
}

export const GetWebhookRepository = createAbstraction<IGetWebhookRepository>(
    "Webhooks/GetWebhookRepository"
);

export namespace GetWebhookRepository {
    export type Interface = IGetWebhookRepository;
    export type Error = IError;
}
