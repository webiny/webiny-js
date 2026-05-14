/* Abstractions bridge packages implement or consume. */
export {
    WebhookFactory,
    WebhookProvider,
    WebhookVerifyPayload,
    WebhookSignPayload,
    WebhookDispatcher
} from "@webiny/api-core/exports/api/webhooks.js";

/* Domain types bridge packages reference. */
export type { Webhook, WebhookCmsEntry } from "~/api/domain/Webhook.js";
export type {
    WebhookDelivery,
    WebhookDeliveryCmsEntry,
    WebhookDeliveryStatus
} from "~/api/domain/WebhookDelivery.js";
export type { IWebhookPayload } from "~/api/features/SendWebhookTask/types.js";
export type { IListMeta } from "~/api/features/ListWebhooks/abstractions.js";

/* Extension for framework wiring. */
export { Extension } from "~/api/Extension.js";
