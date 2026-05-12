import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IWebhook } from "~/api/domain/types.js";
import type {
    WebhookNotFoundError,
    WebhookValidationError,
    WebhookPersistenceError,
    WebhookModelNotFoundError
} from "~/api/domain/errors.js";

export interface IUpdateWebhookInput {
    name?: string;
    slug?: string;
    endpointUrl?: string;
    description?: string;
    enabled?: boolean;
    events?: string[];
    signingSecret?: string;
}

type IError =
    | WebhookNotFoundError
    | WebhookValidationError
    | WebhookPersistenceError
    | WebhookModelNotFoundError;

export interface IUpdateWebhookUseCase {
    execute(id: string, input: IUpdateWebhookInput): Promise<Result<IWebhook, IError>>;
}

export const UpdateWebhookUseCase = createAbstraction<IUpdateWebhookUseCase>(
    "Webhooks/UpdateWebhookUseCase"
);

export namespace UpdateWebhookUseCase {
    export type Interface = IUpdateWebhookUseCase;
    export type Input = IUpdateWebhookInput;
    export type Error = IError;
}

export interface IUpdateWebhookRepository {
    execute(
        webhook: IWebhook
    ): Promise<Result<IWebhook, WebhookPersistenceError | WebhookModelNotFoundError>>;
}

export const UpdateWebhookRepository = createAbstraction<IUpdateWebhookRepository>(
    "Webhooks/UpdateWebhookRepository"
);

export namespace UpdateWebhookRepository {
    export type Interface = IUpdateWebhookRepository;
    export type Error = WebhookPersistenceError | WebhookModelNotFoundError;
}
