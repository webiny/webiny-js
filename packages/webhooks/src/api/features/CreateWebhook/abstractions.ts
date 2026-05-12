import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IWebhook } from "~/api/domain/types.js";
import type {
    WebhookPersistenceError,
    WebhookValidationError,
    WebhookModelNotFoundError
} from "~/api/domain/errors.js";

export interface ICreateWebhookInput {
    name: string;
    slug?: string;
    endpointUrl: string;
    description?: string;
    enabled?: boolean;
    events: string[];
    signingSecret: string;
}

type IError = WebhookValidationError | WebhookPersistenceError | WebhookModelNotFoundError;

export interface ICreateWebhookUseCase {
    execute(input: ICreateWebhookInput): Promise<Result<IWebhook, IError>>;
}

export const CreateWebhookUseCase = createAbstraction<ICreateWebhookUseCase>(
    "Webhooks/CreateWebhookUseCase"
);

export namespace CreateWebhookUseCase {
    export type Interface = ICreateWebhookUseCase;
    export type Input = ICreateWebhookInput;
    export type Error = IError;
}

export interface ICreateWebhookRepository {
    execute(
        webhook: IWebhook
    ): Promise<Result<IWebhook, WebhookPersistenceError | WebhookModelNotFoundError>>;
    slugExists(slug: string): Promise<boolean>;
}

export const CreateWebhookRepository = createAbstraction<ICreateWebhookRepository>(
    "Webhooks/CreateWebhookRepository"
);

export namespace CreateWebhookRepository {
    export type Interface = ICreateWebhookRepository;
    export type Error = WebhookPersistenceError | WebhookModelNotFoundError;
}
