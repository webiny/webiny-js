import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IWebhookSettings } from "~/api/domain/WebhookSettings.js";
import type {
    WebhookModelNotFoundError,
    WebhookNotAuthorizedError,
    WebhookPersistenceError
} from "~/api/domain/errors.js";

type IError = WebhookModelNotFoundError | WebhookPersistenceError | WebhookNotAuthorizedError;

/**
 * Returns the webhook settings, signing secret included, to callers who can edit webhooks.
 * Internal callers that sign payloads use `GetWebhookSettingsRepository` directly.
 */
export interface IGetWebhookSettingsUseCase {
    execute(): Promise<Result<IWebhookSettings, IError>>;
}

export const GetWebhookSettingsUseCase = createAbstraction<IGetWebhookSettingsUseCase>(
    "Webhooks/GetWebhookSettingsUseCase"
);

export namespace GetWebhookSettingsUseCase {
    export type Interface = IGetWebhookSettingsUseCase;
    export type Error = IError;
}
