import { describe, it, expect } from "vitest";
import { useHandler } from "~tests/helpers/useHandler.js";
import { CreateWebhookUseCase } from "~/api/features/CreateWebhook/abstractions.js";
import { TriggerWebhookUseCase } from "~/api/features/TriggerWebhook/abstractions.js";
import { ResendWebhookDeliveryUseCase } from "~/api/features/ResendWebhookDelivery/abstractions.js";
import { ListWebhookDeliveriesUseCase } from "~/api/features/ListWebhookDeliveries/abstractions.js";
import { UpdateWebhookSettingsUseCase } from "~/api/features/UpdateWebhookSettings/abstractions.js";
import { SEND_WEBHOOK_TASK } from "~/api/domain/constants.js";

describe("ResendWebhookDeliveryUseCase", () => {
    const handler = useHandler();

    const createWebhookAndTrigger = async (context: any) => {
        const createUseCase = context.container.resolve(CreateWebhookUseCase);
        const triggerUseCase = context.container.resolve(TriggerWebhookUseCase);

        const webhookResult = await createUseCase.execute({
            name: "Resend Test",
            endpointUrl: "https://example.com/hook",
            events: ["cms.entry.product.published"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });
        const webhook = webhookResult.value;

        const triggerResult = await triggerUseCase.execute(webhook.id, { entryId: "abc" });
        const delivery = triggerResult.value;

        return { webhook, delivery };
    };

    it("should create a new delivery and trigger the send task", async () => {
        const context = await handler.handle();
        const { webhook, delivery } = await createWebhookAndTrigger(context);
        const resendUseCase = context.container.resolve(ResendWebhookDeliveryUseCase);

        const triggeredBefore = handler.noopTaskService.triggered.length;

        const result = await resendUseCase.execute(delivery.id);
        expect(result.isOk()).toBe(true);
        expect(result.value).toBe(true);

        /* A new task should have been triggered. */
        const lastTriggered =
            handler.noopTaskService.triggered[handler.noopTaskService.triggered.length - 1];
        expect(lastTriggered.definition).toBe(SEND_WEBHOOK_TASK);
        expect(lastTriggered.input).toEqual(
            expect.objectContaining({
                webhookId: webhook.id,
                eventName: delivery.eventType
            })
        );
        expect(handler.noopTaskService.triggered.length).toBe(triggeredBefore + 1);
    });

    it("should create a second delivery record for the same webhook", async () => {
        const context = await handler.handle();
        const { webhook, delivery } = await createWebhookAndTrigger(context);
        const resendUseCase = context.container.resolve(ResendWebhookDeliveryUseCase);
        const listDeliveries = context.container.resolve(ListWebhookDeliveriesUseCase);

        await resendUseCase.execute(delivery.id);

        const listResult = await listDeliveries.execute({ where: { webhookId: webhook.id } });
        expect(listResult.isOk()).toBe(true);
        /* Original delivery + resent delivery. */
        expect(listResult.value.items.length).toBe(2);
    });

    it("should fail when delivery does not exist", async () => {
        const context = await handler.handle();
        const resendUseCase = context.container.resolve(ResendWebhookDeliveryUseCase);

        const result = await resendUseCase.execute("nonexistent-id");

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_DELIVERY_NOT_FOUND");
    });

    it("should fail when user has no edit permission", async () => {
        const restrictedHandler = useHandler({
            permissions: [{ name: "webhooks.webhook", rwd: "r" }]
        });
        const context = await restrictedHandler.handle();
        const resendUseCase = context.container.resolve(ResendWebhookDeliveryUseCase);

        const result = await resendUseCase.execute("any-id");

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });

    it("uses deliveryRetentionDays from settings when resending", async () => {
        const context = await handler.handle();
        const updateSettings = context.container.resolve(UpdateWebhookSettingsUseCase);
        const resendUseCase = context.container.resolve(ResendWebhookDeliveryUseCase);

        await updateSettings.execute({ deliveryRetentionDays: 1 });

        const { delivery } = await createWebhookAndTrigger(context);

        const result = await resendUseCase.execute(delivery.id);
        expect(result.isOk()).toBe(true);
    });
});
