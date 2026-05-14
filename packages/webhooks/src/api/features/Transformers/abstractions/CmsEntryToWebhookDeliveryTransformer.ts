import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { WebhookDelivery, WebhookDeliveryCmsEntry } from "~/api/domain/WebhookDelivery.js";
import { createAbstraction } from "@webiny/feature/api";

export interface ICmsEntryToWebhookDeliveryTransformer {
    toWebhookDelivery(input: CmsEntry<WebhookDeliveryCmsEntry["values"]>): Promise<WebhookDelivery>;
    toCmsEntry(input: WebhookDelivery): Promise<CmsEntry<WebhookDeliveryCmsEntry["values"]>>;
}

export const CmsEntryToWebhookDeliveryTransformer =
    createAbstraction<ICmsEntryToWebhookDeliveryTransformer>(
        "Webhooks/CmsEntryToWebhookDeliveryTransformer"
    );

export namespace CmsEntryToWebhookDeliveryTransformer {
    export type Interface = ICmsEntryToWebhookDeliveryTransformer;
    export type ToWebhookDeliveryInput = CmsEntry<WebhookDeliveryCmsEntry["values"]>;
    export type ToWebhookDeliveryOutput = Promise<WebhookDelivery>;
    export type ToCmsEntryInput = WebhookDelivery;
    export type ToCmsEntryOutput = Promise<CmsEntry<WebhookDeliveryCmsEntry["values"]>>;
}
