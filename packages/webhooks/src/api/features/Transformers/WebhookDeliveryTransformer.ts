import { WebhookDeliveryTransformer as WebhookDeliveryTransformerAbstraction } from "./abstractions/WebhookDeliveryTransformer.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { WebhookDelivery, WebhookDeliveryCmsEntry } from "~/api/domain/WebhookDelivery.js";

class WebhookDeliveryTransformerImpl implements WebhookDeliveryTransformerAbstraction.Interface {
    constructor(private readonly compressionHandler: CompressionHandler.Interface) {}

    async fromStorage(
        entry: CmsEntry<WebhookDeliveryCmsEntry["values"]>
    ): Promise<WebhookDelivery> {
        const [payload, requestHeaders, responseHeaders, responseBody] = await Promise.all([
            this.decompress<GenericRecord>(entry.values.payload),
            this.decompress<GenericRecord>(entry.values.requestHeaders),
            this.decompress<GenericRecord>(entry.values.responseHeaders),
            this.decompress<string>(entry.values.responseBody)
        ]);

        return {
            id: entry.entryId,
            createdOn: entry.createdOn,
            savedOn: entry.savedOn,
            webhookId: entry.values.webhookId,
            backgroundTaskId: entry.values.backgroundTaskId,
            eventType: entry.values.eventType,
            status: entry.values.status,
            payload: payload ?? {},
            requestHeaders,
            responseTime: entry.values.responseTime,
            responseStatus: entry.values.responseStatus,
            responseHeaders,
            responseBody
        };
    }

    async toStorage(delivery: WebhookDelivery): Promise<WebhookDeliveryCmsEntry["values"]> {
        const [payload, requestHeaders, responseHeaders, responseBody] = await Promise.all([
            this.compress(delivery.payload),
            delivery.requestHeaders ? this.compress(delivery.requestHeaders) : null,
            delivery.responseHeaders ? this.compress(delivery.responseHeaders) : null,
            delivery.responseBody ? this.compress(delivery.responseBody) : null
        ]);

        return {
            webhookId: delivery.webhookId,
            backgroundTaskId: delivery.backgroundTaskId,
            eventType: delivery.eventType,
            status: delivery.status,
            payload,
            requestHeaders,
            responseTime: delivery.responseTime,
            responseStatus: delivery.responseStatus,
            responseHeaders,
            responseBody
        };
    }

    private async compress(value: unknown): Promise<string> {
        const compressed = await this.compressionHandler.compress(value);
        return JSON.stringify(compressed);
    }

    private async decompress<T>(stored: string | null): Promise<T | null> {
        if (!stored) {
            return null;
        }
        try {
            return await this.compressionHandler.decompress<T>(JSON.parse(stored));
        } catch {
            return null;
        }
    }
}

export const WebhookDeliveryTransformer =
    WebhookDeliveryTransformerAbstraction.createImplementation({
        implementation: WebhookDeliveryTransformerImpl,
        dependencies: [CompressionHandler]
    });
