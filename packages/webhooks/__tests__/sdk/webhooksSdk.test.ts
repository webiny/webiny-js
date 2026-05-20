import { describe, it, expect } from "vitest";
import { useWebinySdk } from "~tests/helpers/useWebinySdk.js";
import { TEST_EVENTS } from "~tests/helpers/TestWebhookProvider.js";

describe("WebhooksSdk", () => {
    const { sdk, handler } = useWebinySdk();

    describe("createWebhook", () => {
        it("should create a webhook", async () => {
            const result = await sdk.webhooks.createWebhook({
                name: "Order Sync",
                endpointUrl: "https://example.com/hook",
                events: ["cms.entry.product.created"]
            });

            expect(result.isOk()).toBe(true);
            const webhook = result.value;
            expect(webhook.id).toEqual(expect.any(String));
            expect(webhook.name).toBe("Order Sync");
            expect(webhook.slug).toBe("order-sync");
            expect(webhook.endpointUrl).toBe("https://example.com/hook");
            expect(webhook.enabled).toBe(false);
            expect(webhook.events).toEqual(["cms.entry.product.created"]);
        });

        it("should return validation error for missing name", async () => {
            const result = await sdk.webhooks.createWebhook({
                name: "",
                endpointUrl: "https://example.com/hook",
                events: ["cms.entry.product.created"]
            });

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("VALIDATION_ERROR");
        });

        it("should return validation error for invalid URL", async () => {
            const result = await sdk.webhooks.createWebhook({
                name: "Bad URL Hook",
                endpointUrl: "not-a-url",
                events: ["cms.entry.product.created"]
            });

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("VALIDATION_ERROR");
        });

        it("should return validation error for empty events", async () => {
            const result = await sdk.webhooks.createWebhook({
                name: "No Events",
                endpointUrl: "https://example.com/hook",
                events: []
            });

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("VALIDATION_ERROR");
        });

        it("should return API error for duplicate slug", async () => {
            const result = await sdk.webhooks.createWebhook({
                name: "Dupe Alpha",
                endpointUrl: "https://example.com/hook",
                events: ["cms.entry.product.created"]
            });
            expect(result.isOk()).toBe(true);

            const second = await sdk.webhooks.createWebhook({
                name: "Dupe Alpha",
                endpointUrl: "https://example.com/hook",
                events: ["cms.entry.product.created"]
            });
            expect(second.isFail()).toBe(true);
            expect(second.error.code).toBe("API_ERROR");
        });
    });

    describe("getWebhook", () => {
        it("should get a webhook by id", async () => {
            const created = await sdk.webhooks.createWebhook({
                name: "Get Test",
                endpointUrl: "https://example.com/hook",
                events: ["cms.entry.product.created"]
            });
            expect(created.isOk()).toBe(true);
            const id = created.value.id;

            const result = await sdk.webhooks.getWebhook({ id });

            expect(result.isOk()).toBe(true);
            expect(result.value.id).toBe(id);
            expect(result.value.name).toBe("Get Test");
        });

        it("should return error for non-existent webhook", async () => {
            const result = await sdk.webhooks.getWebhook({ id: "non-existent-id" });

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("API_ERROR");
        });

        it("should return validation error for empty id", async () => {
            const result = await sdk.webhooks.getWebhook({ id: "" });

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("VALIDATION_ERROR");
        });
    });

    describe("listWebhooks", () => {
        it("should list webhooks", async () => {
            const first = await sdk.webhooks.createWebhook({
                name: "List Alpha",
                endpointUrl: "https://example.com/hook",
                events: ["cms.entry.product.created"]
            });
            expect(first.isOk()).toBe(true);

            const second = await sdk.webhooks.createWebhook({
                name: "List Beta",
                endpointUrl: "https://example.com/hook",
                events: ["cms.entry.product.created"]
            });
            expect(second.isOk()).toBe(true);

            const result = await sdk.webhooks.listWebhooks();

            expect(result.isOk()).toBe(true);
            expect(result.value.data.length).toBeGreaterThanOrEqual(2);
            expect(result.value.meta.totalCount).toBeGreaterThanOrEqual(2);

            const names = result.value.data.map(w => w.name);
            expect(names).toContain("List Alpha");
            expect(names).toContain("List Beta");
        });

        it("should filter by enabled status", async () => {
            const enabled = await sdk.webhooks.createWebhook({
                name: "Enabled Webhook",
                endpointUrl: "https://example.com/hook",
                events: ["cms.entry.product.created"],
                enabled: true
            });
            expect(enabled.isOk()).toBe(true);

            const disabled = await sdk.webhooks.createWebhook({
                name: "Disabled Webhook",
                endpointUrl: "https://example.com/hook",
                events: ["cms.entry.product.created"],
                enabled: false
            });
            expect(disabled.isOk()).toBe(true);

            const result = await sdk.webhooks.listWebhooks({
                where: { enabled: true }
            });

            expect(result.isOk()).toBe(true);
            const names = result.value.data.map(w => w.name);
            expect(names).toContain("Enabled Webhook");
            expect(names).not.toContain("Disabled Webhook");
        });

        it("should return validation error for non-positive limit", async () => {
            const result = await sdk.webhooks.listWebhooks({ limit: 0 });

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("VALIDATION_ERROR");
        });
    });

    describe("updateWebhook", () => {
        it("should update webhook fields", async () => {
            const created = await sdk.webhooks.createWebhook({
                name: "Update Test",
                endpointUrl: "https://example.com/hook",
                events: ["cms.entry.product.created"]
            });
            expect(created.isOk()).toBe(true);
            const id = created.value.id;

            const result = await sdk.webhooks.updateWebhook({
                id,
                name: "Updated Name",
                enabled: true
            });

            expect(result.isOk()).toBe(true);
            expect(result.value.name).toBe("Updated Name");
            expect(result.value.enabled).toBe(true);
            expect(result.value.endpointUrl).toBe("https://example.com/hook");
        });

        it("should return error for non-existent webhook", async () => {
            const result = await sdk.webhooks.updateWebhook({
                id: "non-existent-id",
                name: "Nope"
            });

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("API_ERROR");
        });
    });

    describe("deleteWebhook", () => {
        it("should delete a webhook", async () => {
            const created = await sdk.webhooks.createWebhook({
                name: "Delete Test",
                endpointUrl: "https://example.com/hook",
                events: ["cms.entry.product.created"]
            });
            expect(created.isOk()).toBe(true);
            const id = created.value.id;

            const result = await sdk.webhooks.deleteWebhook({ id });

            expect(result.isOk()).toBe(true);
            expect(result.value).toBe(true);

            const getResult = await sdk.webhooks.getWebhook({ id });
            expect(getResult.isFail()).toBe(true);
            expect(getResult.error.code).toBe("API_ERROR");
        });

        it("should return error for non-existent webhook", async () => {
            const result = await sdk.webhooks.deleteWebhook({ id: "non-existent-id" });

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("API_ERROR");
        });
    });

    describe("listAvailableWebhookEvents", () => {
        it("should return events from the provider", async () => {
            const result = await sdk.webhooks.listAvailableWebhookEvents();

            expect(result.isOk()).toBe(true);
            const events = result.value;
            expect(events).toHaveLength(TEST_EVENTS.length);
            expect(events[0]).toMatchObject({
                app: expect.any(String),
                eventName: expect.any(String),
                label: expect.any(String)
            });
        });
    });

    describe("triggerWebhook", () => {
        it("should trigger and return a delivery", async () => {
            const created = await sdk.webhooks.createWebhook({
                name: "Trigger Test",
                endpointUrl: "https://example.com/hook",
                events: ["cms.entry.product.created"],
                enabled: true
            });
            expect(created.isOk()).toBe(true);
            const webhookId = created.value.id;

            const result = await sdk.webhooks.triggerWebhook({
                id: webhookId,
                payload: { orderId: "ORD-123" }
            });

            expect(result.isOk()).toBe(true);
            const delivery = result.value;
            expect(delivery.id).toEqual(expect.any(String));
            expect(delivery.webhookId).toBe(webhookId);
            expect(delivery.status).toBe("pending");
            expect(delivery.eventType).toBe("webhook.test");
        });

        it("should return error for non-existent webhook", async () => {
            const result = await sdk.webhooks.triggerWebhook({
                id: "non-existent-id",
                payload: { test: true }
            });

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("API_ERROR");
        });
    });

    describe("webhook deliveries", () => {
        it("should list deliveries for a webhook", async () => {
            const created = await sdk.webhooks.createWebhook({
                name: "Deliveries List Test",
                endpointUrl: "https://example.com/hook",
                events: ["cms.entry.product.created"],
                enabled: true
            });
            expect(created.isOk()).toBe(true);
            const webhookId = created.value.id;

            const trigger = await sdk.webhooks.triggerWebhook({
                id: webhookId,
                payload: { orderId: "ORD-001" }
            });
            expect(trigger.isOk()).toBe(true);

            const result = await sdk.webhooks.listWebhookDeliveries({
                where: { webhookId_eq: webhookId }
            });

            expect(result.isOk()).toBe(true);
            expect(result.value.data.length).toBeGreaterThanOrEqual(1);
            expect(result.value.data[0].webhookId).toBe(webhookId);
            expect(result.value.meta.totalCount).toBeGreaterThanOrEqual(1);
        });

        it("should return empty list when no deliveries exist", async () => {
            const created = await sdk.webhooks.createWebhook({
                name: "No Deliveries Test",
                endpointUrl: "https://example.com/hook",
                events: ["cms.entry.product.created"]
            });
            expect(created.isOk()).toBe(true);

            const result = await sdk.webhooks.listWebhookDeliveries({
                where: { webhookId_eq: created.value.id }
            });

            expect(result.isOk()).toBe(true);
            expect(result.value.data).toHaveLength(0);
            expect(result.value.meta.totalCount).toBe(0);
        });

        it("should get a single delivery by id", async () => {
            const created = await sdk.webhooks.createWebhook({
                name: "Get Delivery Test",
                endpointUrl: "https://example.com/hook",
                events: ["cms.entry.product.created"],
                enabled: true
            });
            expect(created.isOk()).toBe(true);
            const webhookId = created.value.id;

            const trigger = await sdk.webhooks.triggerWebhook({
                id: webhookId,
                payload: { orderId: "ORD-002" }
            });
            expect(trigger.isOk()).toBe(true);
            const deliveryId = trigger.value.id;

            const result = await sdk.webhooks.getWebhookDelivery({ id: deliveryId });

            expect(result.isOk()).toBe(true);
            expect(result.value.id).toBe(deliveryId);
            expect(result.value.webhookId).toBe(webhookId);
        });

        it("should return error for non-existent delivery", async () => {
            const result = await sdk.webhooks.getWebhookDelivery({ id: "non-existent-id" });

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("API_ERROR");
        });

        it("should resend a delivery", async () => {
            const created = await sdk.webhooks.createWebhook({
                name: "Resend Test",
                endpointUrl: "https://example.com/hook",
                events: ["cms.entry.product.created"],
                enabled: true
            });
            expect(created.isOk()).toBe(true);
            const webhookId = created.value.id;

            const trigger = await sdk.webhooks.triggerWebhook({
                id: webhookId,
                payload: { orderId: "ORD-003" }
            });
            expect(trigger.isOk()).toBe(true);
            const deliveryId = trigger.value.id;

            const result = await sdk.webhooks.resendWebhookDelivery({ id: deliveryId });

            expect(result.isOk()).toBe(true);
            expect(result.value).toBe(true);

            const taskTriggered = handler.noopTaskService.triggered;
            expect(taskTriggered.length).toBeGreaterThanOrEqual(2);
        });
    });
});
