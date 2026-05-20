export type { Webhook, WebhookDelivery, WebhookEvent } from "@webiny/sdk";

export type { ListWebhooksParams, ListWebhooksResult } from "@webiny/sdk";

export type { ListWebhookDeliveriesParams, ListWebhookDeliveriesResult } from "@webiny/sdk";

export type { CreateWebhookParams } from "@webiny/sdk";

export type { UpdateWebhookParams } from "@webiny/sdk";

export interface WebhookSettings {
    signingSecret: string | undefined;
}
