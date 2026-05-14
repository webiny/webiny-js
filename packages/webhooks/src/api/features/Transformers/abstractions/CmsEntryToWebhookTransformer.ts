import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { Webhook, WebhookCmsEntry } from "~/api/domain/Webhook.js";
import { createAbstraction } from "@webiny/feature/api";

export type TransformerWebhookCmsEntry = Pick<CmsEntry<WebhookCmsEntry["values"]>, "id" | "values">;

export interface ICmsEntryToWebhookTransformer {
    toWebhook(input: CmsEntry<WebhookCmsEntry["values"]>): Webhook;
    toCmsEntry(input: Webhook): TransformerWebhookCmsEntry;
}

export const CmsEntryToWebhookTransformer = createAbstraction<ICmsEntryToWebhookTransformer>(
    "Webhooks/CmsEntryToWebhookTransformer"
);

export namespace CmsEntryToWebhookTransformer {
    export type Interface = ICmsEntryToWebhookTransformer;
    export type ToWebhookInput = CmsEntry<WebhookCmsEntry["values"]>;
    export type ToWebhookOutput = Webhook;
    export type ToCmsEntryInput = Webhook;
    export type ToCmsEntryOutput = TransformerWebhookCmsEntry;
}
