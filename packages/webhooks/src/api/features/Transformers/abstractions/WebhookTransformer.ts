import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { Webhook, WebhookCmsEntry } from "~/api/domain/Webhook.js";
import { createAbstraction } from "@webiny/feature/api";

export interface IWebhookTransformer {
    fromStorage(entry: CmsEntry<WebhookCmsEntry["values"]>): Promise<Webhook>;
    toStorage(webhook: Webhook): Promise<WebhookCmsEntry["values"]>;
}

export const WebhookTransformer = createAbstraction<IWebhookTransformer>(
    "Webhooks/WebhookTransformer"
);

export namespace WebhookTransformer {
    export type Interface = IWebhookTransformer;
}
