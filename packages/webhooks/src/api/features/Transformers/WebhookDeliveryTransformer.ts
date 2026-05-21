import { WebhookDeliveryTransformer as WebhookDeliveryTransformerAbstraction } from "./abstractions/WebhookDeliveryTransformer.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type {
    WebhookDelivery,
    WebhookDeliveryCmsEntryValues
} from "~/api/domain/WebhookDelivery.js";

class WebhookDeliveryTransformerImpl implements WebhookDeliveryTransformerAbstraction.Interface {
    public fromStorage(entry: CmsEntry<WebhookDeliveryCmsEntryValues>): WebhookDelivery {
        return {
            id: entry.entryId,
            createdOn: entry.createdOn,
            savedOn: entry.savedOn,
            expiresAt: entry.values.expiresAt,
            webhookId: entry.values.webhookId,
            backgroundTaskId: entry.values.backgroundTaskId,
            eventType: entry.values.eventType,
            status: entry.values.status,
            payload: this.decompress(entry.values.payload),
            requestHeaders: this.decompress(entry.values.requestHeaders),
            responseTime: entry.values.responseTime,
            responseStatus: entry.values.responseStatus,
            responseHeaders: this.decompress(entry.values.responseHeaders),
            responseBody: this.decompress(entry.values.responseBody)
        };
    }

    public toStorage(delivery: WebhookDelivery): WebhookDeliveryCmsEntryValues {
        return {
            webhookId: delivery.webhookId,
            backgroundTaskId: delivery.backgroundTaskId,
            eventType: delivery.eventType,
            status: delivery.status,
            payload: this.compress(delivery.payload),
            requestHeaders: this.compress(delivery.requestHeaders),
            responseTime: delivery.responseTime,
            responseStatus: delivery.responseStatus,
            responseHeaders: this.compress(delivery.responseHeaders),
            responseBody: this.compress(delivery.responseBody),
            expiresAt: delivery.expiresAt
        };
    }

    private compress(value: unknown): string {
        if (value === null || value === undefined) {
            return null as unknown as string;
        }
        try {
            return JSON.stringify(value);
        } catch {
            return value as string;
        }
    }

    private decompress<T>(stored: string | null | undefined): T {
        if (!stored) {
            return null as T;
        }
        try {
            return JSON.parse(stored) as T;
        } catch {
            return stored as T;
        }
    }
}

export const WebhookDeliveryTransformer =
    WebhookDeliveryTransformerAbstraction.createImplementation({
        implementation: WebhookDeliveryTransformerImpl,
        dependencies: []
    });
