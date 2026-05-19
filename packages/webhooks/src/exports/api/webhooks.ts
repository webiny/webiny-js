/* Domain types bridge packages reference. */
export type { Webhook, WebhookCmsEntry, WebhookCmsEntryValues } from "~/api/domain/Webhook.js";
export type {
    WebhookDelivery,
    WebhookDeliveryCmsEntry,
    WebhookDeliveryCmsEntryValues,
    WebhookDeliveryStatus
} from "~/api/domain/WebhookDelivery.js";
export type { IWebhookPayload } from "~/api/features/SendWebhookTask/types.js";
export type { IListMeta } from "~/api/features/ListWebhooks/abstractions.js";

/* Extension for framework wiring. */
export { createWebhooks } from "~/api/index.js";
