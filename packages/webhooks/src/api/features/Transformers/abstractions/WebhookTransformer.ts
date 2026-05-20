import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { Webhook, WebhookCmsEntryValues } from "~/api/domain/Webhook.js";
import { createAbstraction } from "@webiny/feature/api";

export interface IWebhookTransformer {
    fromStorage(entry: CmsEntry<WebhookCmsEntryValues>): Webhook;
    toStorage(webhook: Webhook): WebhookCmsEntryValues;
}

export const WebhookTransformer = createAbstraction<IWebhookTransformer>(
    "Webhooks/WebhookTransformer"
);

export namespace WebhookTransformer {
    export type Interface = IWebhookTransformer;
}
