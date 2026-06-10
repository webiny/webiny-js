import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IWebhookSettings } from "~/api/domain/WebhookSettings.js";
import type {
    WebhookModelNotFoundError,
    WebhookNotAuthorizedError,
    WebhookPersistenceError,
    WebhookValidationError
} from "~/api/domain/errors.js";

export interface IUpdateWebhookSettingsInput {
    signingSecret?: string;
    deliveryRetentionDays?: number;
}

type IError =
    | WebhookModelNotFoundError
    | WebhookPersistenceError
    | WebhookNotAuthorizedError
    | WebhookValidationError;

export interface IUpdateWebhookSettingsUseCase {
    execute(input: IUpdateWebhookSettingsInput): Promise<Result<IWebhookSettings, IError>>;
}

export const UpdateWebhookSettingsUseCase = createAbstraction<IUpdateWebhookSettingsUseCase>(
    "Webhooks/UpdateWebhookSettingsUseCase"
);

export namespace UpdateWebhookSettingsUseCase {
    export type Interface = IUpdateWebhookSettingsUseCase;
    export type Input = IUpdateWebhookSettingsInput;
    export type Error = IError;
}

type IRepositoryError = WebhookModelNotFoundError | WebhookPersistenceError;

export interface IUpdateWebhookSettingsRepository {
    execute(
        input: IUpdateWebhookSettingsInput
    ): Promise<Result<IWebhookSettings, IRepositoryError>>;
}

export const UpdateWebhookSettingsRepository = createAbstraction<IUpdateWebhookSettingsRepository>(
    "Webhooks/UpdateWebhookSettingsRepository"
);

export namespace UpdateWebhookSettingsRepository {
    export type Interface = IUpdateWebhookSettingsRepository;
    export type Error = IRepositoryError;
}
