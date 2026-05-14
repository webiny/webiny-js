import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Webhook, WebhookCmsEntry } from "~/api/domain/Webhook.js";
import type {
    WebhookModelNotFoundError,
    WebhookNotAuthorizedError,
    WebhookPersistenceError,
    WebhookValidationError
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

type IError =
    | WebhookValidationError
    | WebhookPersistenceError
    | WebhookModelNotFoundError
    | WebhookNotAuthorizedError;

export interface ICreateWebhookUseCase {
    execute(input: ICreateWebhookInput): Promise<Result<Webhook, IError>>;
}

export const CreateWebhookUseCase = createAbstraction<ICreateWebhookUseCase>(
    "Webhooks/CreateWebhookUseCase"
);

export namespace CreateWebhookUseCase {
    export type Interface = ICreateWebhookUseCase;
    export type Input = ICreateWebhookInput;
    export type Error = IError;
}

export type ICreateWebhookRepositoryResponse = Result<
    Webhook,
    WebhookPersistenceError | WebhookModelNotFoundError
>;

export interface ICreateWebhookRepository {
    execute(input: WebhookCmsEntry["values"]): Promise<ICreateWebhookRepositoryResponse>;
    slugExists(slug: string): Promise<boolean>;
}

export const CreateWebhookRepository = createAbstraction<ICreateWebhookRepository>(
    "Webhooks/CreateWebhookRepository"
);

export namespace CreateWebhookRepository {
    export type Interface = ICreateWebhookRepository;
    export type Response = ICreateWebhookRepositoryResponse;
    export type Error = WebhookPersistenceError | WebhookModelNotFoundError;
}
