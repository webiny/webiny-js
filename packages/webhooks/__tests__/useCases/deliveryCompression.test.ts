import { describe, it, expect } from "vitest";
import { useHandler } from "~tests/helpers/useHandler.js";
import { CreateWebhookUseCase } from "~/api/features/CreateWebhook/abstractions.js";
import { TriggerWebhookUseCase } from "~/api/features/TriggerWebhook/abstractions.js";
import { UpdateWebhookDeliveryRepository } from "~/api/features/UpdateWebhookDelivery/abstractions.js";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { StorageOperations } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { WEBHOOK_DELIVERY_MODEL_ID } from "~/api/domain/constants.js";

describe("Webhook delivery fields are compressed in storage", () => {
    const handler = useHandler();

    it("should store payload, requestHeaders, and responseBody as compressed values", async () => {
        const context = await handler.handle();
        const container = context.container;

        const createWebhook = container.resolve(CreateWebhookUseCase);
        const triggerWebhook = container.resolve(TriggerWebhookUseCase);
        const updateDelivery = container.resolve(UpdateWebhookDeliveryRepository);
        const getModel = container.resolve(GetModelRepository);
        const storageOps = container.resolve(StorageOperations);

        const webhookResult = await createWebhook.execute({
            name: "Compression Test",
            endpointUrl: "https://example.com/hook",
            events: ["cms.entry.product.created"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });
        expect(webhookResult.isOk()).toBe(true);

        const triggerResult = await triggerWebhook.execute(webhookResult.value.id, {
            orderId: "ORD-001",
            items: [{ sku: "WIDGET-42", qty: 10 }]
        });
        expect(triggerResult.isOk()).toBe(true);
        const deliveryId = triggerResult.value.id;

        const updateResult = await updateDelivery.execute(deliveryId, {
            requestHeaders: {
                "Content-Type": "application/json",
                "X-Custom": "test-value"
            },
            responseBody: '{"status":"accepted","ref":"abc-123"}',
            responseStatus: 200,
            responseTime: 42,
            status: "delivered"
        });
        expect(updateResult.isOk()).toBe(true);

        const modelResult = await getModel.execute(WEBHOOK_DELIVERY_MODEL_ID);
        expect(modelResult.isOk()).toBe(true);
        const model = modelResult.value;

        const rawEntry = await storageOps.entries.getLatestRevisionByEntryId(model, {
            id: deliveryId
        });
        expect(rawEntry).not.toBeNull();

        const values = rawEntry!.values;

        expect(typeof values.payload).toBe("string");
        expect(values.payload).toContain("compression");

        expect(typeof values.requestHeaders).toBe("string");
        expect(values.requestHeaders).toContain("compression");

        expect(typeof values.responseBody).toBe("string");
        expect(values.responseBody).toContain("compression");
    });

    it("should round-trip: domain → storage (compressed) → domain (decompressed)", async () => {
        const context = await handler.handle();
        const container = context.container;

        const createWebhook = container.resolve(CreateWebhookUseCase);
        const triggerWebhook = container.resolve(TriggerWebhookUseCase);
        const updateDelivery = container.resolve(UpdateWebhookDeliveryRepository);

        const webhookResult = await createWebhook.execute({
            name: "Round Trip Test",
            endpointUrl: "https://example.com/hook",
            events: ["cms.entry.product.created"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });
        expect(webhookResult.isOk()).toBe(true);

        const payload = { orderId: "ORD-002", nested: { deep: true } };

        const triggerResult = await triggerWebhook.execute(webhookResult.value.id, payload);
        expect(triggerResult.isOk()).toBe(true);
        const deliveryId = triggerResult.value.id;

        const requestHeaders = { "Content-Type": "application/json", Authorization: "Bearer xyz" };
        const responseBody = '{"ok":true}';

        const updateResult = await updateDelivery.execute(deliveryId, {
            requestHeaders,
            responseBody,
            responseStatus: 200,
            responseTime: 15,
            status: "delivered"
        });
        expect(updateResult.isOk()).toBe(true);

        const delivery = updateResult.value;
        expect(delivery.payload).toEqual(payload);
        expect(delivery.requestHeaders).toEqual(requestHeaders);
        expect(delivery.responseBody).toBe(responseBody);
    });
});
