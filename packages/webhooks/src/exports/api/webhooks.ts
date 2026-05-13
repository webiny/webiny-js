// Abstractions bridge packages implement or consume.
export { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
export { WebhookEventProvider } from "@webiny/api-core/features/webhooks/index.js";
export { WebhookSignPayload } from "@webiny/api-core/features/webhooks/index.js";

// Domain types bridge packages reference.
export type {
    IWebhook,
    IWebhookValues,
    IWebhookDelivery,
    IWebhookDeliveryValues,
    IWebhookEventDefinition,
    IWebhookPayload,
    IListMeta
} from "~/api/domain/types.js";

// Extension for framework wiring.
export { Extension } from "~/api/Extension.js";
