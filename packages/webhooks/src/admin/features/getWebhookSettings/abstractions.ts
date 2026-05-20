import { createAbstraction } from "@webiny/feature/admin";
import type { WebhookSettings } from "~/admin/shared/types.js";

export interface IGetWebhookSettingsGateway {
    execute(): Promise<WebhookSettings>;
}

export const GetWebhookSettingsGateway = createAbstraction<IGetWebhookSettingsGateway>(
    "GetWebhookSettingsGateway"
);

export namespace GetWebhookSettingsGateway {
    export type Interface = IGetWebhookSettingsGateway;
}

export interface IGetWebhookSettingsUseCase {
    execute(): Promise<WebhookSettings>;
}

export const GetWebhookSettingsUseCase = createAbstraction<IGetWebhookSettingsUseCase>(
    "GetWebhookSettingsUseCase"
);

export namespace GetWebhookSettingsUseCase {
    export type Interface = IGetWebhookSettingsUseCase;
}
