import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { WebhooksTransformerFeature } from "~/api/features/Transformers/feature.js";
import { WebhookDeliveryTransformer } from "~/api/features/Transformers/abstractions/WebhookDeliveryTransformer.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { WebhookDeliveryCmsEntryValues } from "~/api/domain/WebhookDelivery.js";

const makeCmsEntry = (
    overrides?: Partial<WebhookDeliveryCmsEntryValues>
): CmsEntry<WebhookDeliveryCmsEntryValues> =>
    ({
        entryId: "del-1",
        createdOn: "2026-01-01T00:00:00Z",
        savedOn: "2026-01-02T00:00:00Z",
        values: {
            webhookId: "wh-1",
            backgroundTaskId: "task-1",
            eventType: "cms.entry.product.published",
            status: "delivered",
            payload: JSON.stringify({ entryId: "abc" }),
            requestHeaders: JSON.stringify({ "Content-Type": "application/json" }),
            responseTime: 150,
            responseStatus: 200,
            responseHeaders: JSON.stringify({ "x-request-id": "req-123" }),
            responseBody: JSON.stringify({ ok: true }),
            ...overrides
        }
    }) as unknown as CmsEntry<WebhookDeliveryCmsEntryValues>;

describe("WebhookDeliveryTransformer", () => {
    const container = new Container();
    WebhooksTransformerFeature.register(container);
    const transformer = container.resolve(WebhookDeliveryTransformer);

    describe("fromStorage", () => {
        it("parses JSON string fields into objects", () => {
            const delivery = transformer.fromStorage(makeCmsEntry());

            expect(delivery).toEqual({
                id: "del-1",
                createdOn: "2026-01-01T00:00:00Z",
                savedOn: "2026-01-02T00:00:00Z",
                webhookId: "wh-1",
                backgroundTaskId: "task-1",
                eventType: "cms.entry.product.published",
                status: "delivered",
                payload: { entryId: "abc" },
                requestHeaders: { "Content-Type": "application/json" },
                responseTime: 150,
                responseStatus: 200,
                responseHeaders: { "x-request-id": "req-123" },
                responseBody: { ok: true }
            });
        });

        it("handles null string fields gracefully", () => {
            const delivery = transformer.fromStorage(
                makeCmsEntry({
                    requestHeaders: null,
                    responseHeaders: null,
                    responseBody: null
                })
            );

            expect(delivery.requestHeaders).toBeNull();
            expect(delivery.responseHeaders).toBeNull();
            expect(delivery.responseBody).toBeNull();
        });

        it("returns raw string when JSON.parse fails", () => {
            const delivery = transformer.fromStorage(
                makeCmsEntry({
                    responseBody: "not-valid-json"
                })
            );

            expect(delivery.responseBody).toBe("not-valid-json");
        });

        it("handles empty string as null", () => {
            const delivery = transformer.fromStorage(
                makeCmsEntry({
                    responseBody: "" as unknown as string
                })
            );

            expect(delivery.responseBody).toBeNull();
        });
    });

    describe("toStorage", () => {
        it("stringifies object fields into JSON strings", () => {
            const values = transformer.toStorage({
                id: "del-1",
                createdOn: "2026-01-01T00:00:00Z",
                savedOn: "2026-01-02T00:00:00Z",
                webhookId: "wh-1",
                backgroundTaskId: "task-1",
                eventType: "cms.entry.product.published",
                status: "delivered",
                payload: { entryId: "abc" },
                requestHeaders: { "Content-Type": "application/json" },
                responseTime: 150,
                responseStatus: 200,
                responseHeaders: { "x-request-id": "req-123" },
                responseBody: "OK"
            });

            expect(values.payload).toBe('{"entryId":"abc"}');
            expect(values.requestHeaders).toBe('{"Content-Type":"application/json"}');
            expect(values.responseHeaders).toBe('{"x-request-id":"req-123"}');
            expect(values.responseBody).toBe('"OK"');
        });

        it("preserves null fields as null", () => {
            const values = transformer.toStorage({
                id: "del-1",
                createdOn: "2026-01-01T00:00:00Z",
                savedOn: "2026-01-02T00:00:00Z",
                webhookId: "wh-1",
                backgroundTaskId: null,
                eventType: "cms.entry.product.published",
                status: "pending",
                payload: { test: true },
                requestHeaders: null,
                responseTime: null,
                responseStatus: null,
                responseHeaders: null,
                responseBody: null
            });

            expect(values.requestHeaders).toBeNull();
            expect(values.responseHeaders).toBeNull();
            expect(values.responseBody).toBeNull();
            expect(values.backgroundTaskId).toBeNull();
        });

        it("strips id, createdOn, savedOn from output", () => {
            const values = transformer.toStorage({
                id: "del-1",
                createdOn: "2026-01-01T00:00:00Z",
                savedOn: "2026-01-02T00:00:00Z",
                webhookId: "wh-1",
                backgroundTaskId: null,
                eventType: "test",
                status: "pending",
                payload: {},
                requestHeaders: null,
                responseTime: null,
                responseStatus: null,
                responseHeaders: null,
                responseBody: null
            });

            expect(values).not.toHaveProperty("id");
            expect(values).not.toHaveProperty("createdOn");
            expect(values).not.toHaveProperty("savedOn");
        });
    });
});
