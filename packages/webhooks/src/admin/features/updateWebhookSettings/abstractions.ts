import { createAbstraction } from "@webiny/feature/admin";
import type { WebhookSettings } from "~/admin/shared/types.js";

export interface UpdateWebhookSettingsInput {
    signingSecret?: string;
}

export interface IUpdateWebhookSettingsGateway {
    execute(input: UpdateWebhookSettingsInput): Promise<WebhookSettings>;
}

export const UpdateWebhookSettingsGateway = createAbstraction<IUpdateWebhookSettingsGateway>(
    "UpdateWebhookSettingsGateway"
);

export namespace UpdateWebhookSettingsGateway {
    export type Interface = IUpdateWebhookSettingsGateway;
}

export interface IUpdateWebhookSettingsUseCase {
    execute(input: UpdateWebhookSettingsInput): Promise<WebhookSettings>;
}

export const UpdateWebhookSettingsUseCase = createAbstraction<IUpdateWebhookSettingsUseCase>(
    "UpdateWebhookSettingsUseCase"
);

export namespace UpdateWebhookSettingsUseCase {
    export type Interface = IUpdateWebhookSettingsUseCase;
}
