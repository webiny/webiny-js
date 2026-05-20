import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IWebhookSettings } from "~/api/domain/WebhookSettings.js";
import type { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";

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
