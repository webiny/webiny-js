import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    WebhookNotFoundError,
    WebhookPersistenceError,
    WebhookModelNotFoundError,
    WebhookNotAuthorizedError,
    WebhookValidationError
} from "~/api/domain/errors.js";

type IError =
    | WebhookNotFoundError
    | WebhookPersistenceError
    | WebhookModelNotFoundError
    | WebhookNotAuthorizedError
    | WebhookValidationError;

export interface IDeleteWebhookUseCase {
    execute(id: string): Promise<Result<boolean, IError>>;
}

export const DeleteWebhookUseCase = createAbstraction<IDeleteWebhookUseCase>(
    "Webhooks/DeleteWebhookUseCase"
);

export namespace DeleteWebhookUseCase {
    export type Interface = IDeleteWebhookUseCase;
    export type Error = IError;
}

export interface IDeleteWebhookRepository {
    execute(id: string): Promise<Result<boolean, IError>>;
}

export const DeleteWebhookRepository = createAbstraction<IDeleteWebhookRepository>(
    "Webhooks/DeleteWebhookRepository"
);

export namespace DeleteWebhookRepository {
    export type Interface = IDeleteWebhookRepository;
    export type Error = IError;
}
