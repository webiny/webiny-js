import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IWebhookSettings } from "~/api/domain/WebhookSettings.js";
import type {
    WebhookModelNotFoundError,
    WebhookNotAuthorizedError,
    WebhookPersistenceError
} from "~/api/domain/errors.js";

type IError = WebhookModelNotFoundError | WebhookPersistenceError;

export interface IGetWebhookSettingsRepository {
    execute(): Promise<Result<IWebhookSettings, IError>>;
}

export const GetWebhookSettingsRepository = createAbstraction<IGetWebhookSettingsRepository>(
    "Webhooks/GetWebhookSettingsRepository"
);

export namespace GetWebhookSettingsRepository {
    export type Interface = IGetWebhookSettingsRepository;
    export type Error = IError;
}

type IUseCaseError = IError | WebhookNotAuthorizedError;

/**
 * Settings hold the global signing secret, so reading them needs the same permission as
 * changing them. Internal code that signs deliveries uses the repository directly.
 */
export interface IGetWebhookSettingsUseCase {
    execute(): Promise<Result<IWebhookSettings, IUseCaseError>>;
}

export const GetWebhookSettingsUseCase = createAbstraction<IGetWebhookSettingsUseCase>(
    "Webhooks/GetWebhookSettingsUseCase"
);

export namespace GetWebhookSettingsUseCase {
    export type Interface = IGetWebhookSettingsUseCase;
    export type Error = IUseCaseError;
}
