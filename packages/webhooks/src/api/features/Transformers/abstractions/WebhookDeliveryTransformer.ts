import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type {
    WebhookDelivery,
    WebhookDeliveryCmsEntryValues
} from "~/api/domain/WebhookDelivery.js";
import { createAbstraction } from "@webiny/feature/api";

export interface IWebhookDeliveryTransformer {
    fromStorage(entry: CmsEntry<WebhookDeliveryCmsEntryValues>): WebhookDelivery;
    toStorage(delivery: WebhookDelivery): WebhookDeliveryCmsEntryValues;
}

export const WebhookDeliveryTransformer = createAbstraction<IWebhookDeliveryTransformer>(
    "Webhooks/WebhookDeliveryTransformer"
);

export namespace WebhookDeliveryTransformer {
    export type Interface = IWebhookDeliveryTransformer;
}
