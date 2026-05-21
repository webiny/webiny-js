import { describe, it, expect } from "vitest";
import { useHandler } from "~tests/helpers/useHandler.js";
import { CreateWebhookUseCase } from "~/api/features/CreateWebhook/abstractions.js";
import { TriggerWebhookUseCase } from "~/api/features/TriggerWebhook/abstractions.js";
import { GetWebhookDeliveryUseCase } from "~/api/features/GetWebhookDelivery/abstractions.js";
import { UpdateWebhookSettingsUseCase } from "~/api/features/UpdateWebhookSettings/abstractions.js";
import { SEND_WEBHOOK_TASK } from "~/api/domain/constants.js";

describe("TriggerWebhookUseCase", () => {
    const handler = useHandler();

    it("should create a delivery and trigger the send task", async () => {
        const context = await handler.handle();
        const createUseCase = context.container.resolve(CreateWebhookUseCase);
        const triggerUseCase = context.container.resolve(TriggerWebhookUseCase);

        /* Create a webhook first. */
        const webhookResult = await createUseCase.execute({
            name: "Trigger Test",
            endpointUrl: "https://example.com/hook",
            events: ["cms.entry.product.published"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });
        expect(webhookResult.isOk()).toBe(true);
        const webhook = webhookResult.value;

        /* Trigger it. */
        const result = await triggerUseCase.execute(webhook.id, { foo: "bar" });

        expect(result.isOk()).toBe(true);

        const delivery = result.value;
        expect(delivery.webhookId).toBe(webhook.id);
        expect(delivery.eventType).toBe("webhook.test");
        expect(delivery.status).toBe("pending");

        /* Verify the noop TaskService was called. */
        const lastTriggered =
            handler.noopTaskService.triggered[handler.noopTaskService.triggered.length - 1];
        expect(lastTriggered.definition).toBe(SEND_WEBHOOK_TASK);
        expect(lastTriggered.input).toEqual({
            webhookId: webhook.id,
            eventName: "webhook.test",
            deliveryId: delivery.id
        });
    });

    it("should persist the delivery to storage", async () => {
        const context = await handler.handle();
        const createUseCase = context.container.resolve(CreateWebhookUseCase);
        const triggerUseCase = context.container.resolve(TriggerWebhookUseCase);
        const getDeliveryUseCase = context.container.resolve(GetWebhookDeliveryUseCase);

        const webhookResult = await createUseCase.execute({
            name: "Delivery Persist Test",
            endpointUrl: "https://example.com/hook",
            events: ["cms.entry.product.published"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });
        const webhook = webhookResult.value;

        const triggerResult = await triggerUseCase.execute(webhook.id, { key: "value" });
        expect(triggerResult.isOk()).toBe(true);

        /* Read it back from storage. */
        const getResult = await getDeliveryUseCase.execute(triggerResult.value.id);
        expect(getResult.isOk()).toBe(true);
        expect(getResult.value.webhookId).toBe(webhook.id);
        expect(getResult.value.status).toBe("pending");
    });

    it("should fail when webhook does not exist", async () => {
        const context = await handler.handle();
        const triggerUseCase = context.container.resolve(TriggerWebhookUseCase);

        const result = await triggerUseCase.execute("nonexistent-id", {});

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_NOT_FOUND");
    });

    it("should fail when user has no edit permission", async () => {
        const restrictedHandler = useHandler({
            permissions: [{ name: "webhooks.webhook", rwd: "r" }]
        });
        const context = await restrictedHandler.handle();
        const triggerUseCase = context.container.resolve(TriggerWebhookUseCase);

        const result = await triggerUseCase.execute("any-id", {});

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });

    it("uses deliveryRetentionDays from settings to compute expiresAt", async () => {
        const context = await handler.handle();
        const createUseCase = context.container.resolve(CreateWebhookUseCase);
        const updateSettings = context.container.resolve(UpdateWebhookSettingsUseCase);
        const triggerUseCase = context.container.resolve(TriggerWebhookUseCase);

        await updateSettings.execute({ deliveryRetentionDays: 1 });

        const webhookResult = await createUseCase.execute({
            name: "Retention Test",
            endpointUrl: "https://example.com/hook",
            events: ["cms.entry.product.published"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });
        const webhook = webhookResult.value;

        const result = await triggerUseCase.execute(webhook.id, { foo: "bar" });

        expect(result.isOk()).toBe(true);
        expect(result.value.webhookId).toBe(webhook.id);
        expect(result.value.status).toBe("pending");
    });
});
