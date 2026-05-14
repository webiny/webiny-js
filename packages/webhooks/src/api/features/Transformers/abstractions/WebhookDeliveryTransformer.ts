import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { WebhookDelivery, WebhookDeliveryCmsEntry } from "~/api/domain/WebhookDelivery.js";
import { createAbstraction } from "@webiny/feature/api";

export interface IWebhookDeliveryTransformer {
    fromStorage(entry: CmsEntry<WebhookDeliveryCmsEntry["values"]>): Promise<WebhookDelivery>;
    toStorage(delivery: WebhookDelivery): Promise<WebhookDeliveryCmsEntry["values"]>;
}

export const WebhookDeliveryTransformer = createAbstraction<IWebhookDeliveryTransformer>(
    "Webhooks/WebhookDeliveryTransformer"
);

export namespace WebhookDeliveryTransformer {
    export type Interface = IWebhookDeliveryTransformer;
}
