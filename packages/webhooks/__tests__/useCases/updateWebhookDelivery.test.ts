import { describe, it, expect } from "vitest";
import { useHandler } from "~tests/helpers/useHandler.js";
import { CreateWebhookUseCase } from "~/api/features/CreateWebhook/abstractions.js";
import { TriggerWebhookUseCase } from "~/api/features/TriggerWebhook/abstractions.js";
import { UpdateWebhookDeliveryRepository } from "~/api/features/UpdateWebhookDelivery/abstractions.js";
import { GetWebhookDeliveryUseCase } from "~/api/features/GetWebhookDelivery/abstractions.js";

describe("UpdateWebhookDeliveryRepository", () => {
    const handler = useHandler();

    const createDelivery = async (context: any) => {
        const createUseCase = context.container.resolve(CreateWebhookUseCase);
        const triggerUseCase = context.container.resolve(TriggerWebhookUseCase);

        const webhookResult = await createUseCase.execute({
            name: "Delivery Update Test",
            endpointUrl: "https://example.com/hook",
            events: ["cms.entry.product.published"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });
        expect(webhookResult.isOk()).toBe(true);

        const triggerResult = await triggerUseCase.execute(webhookResult.value.id, { key: "val" });
        expect(triggerResult.isOk()).toBe(true);

        return triggerResult.value;
    };

    it("should update delivery status and response fields", async () => {
        const context = await handler.handle();
        const delivery = await createDelivery(context);
        const updateRepo = context.container.resolve(UpdateWebhookDeliveryRepository);
        const getUseCase = context.container.resolve(GetWebhookDeliveryUseCase);

        const result = await updateRepo.execute(delivery.id, {
            status: "delivered",
            responseStatus: 200,
            responseTime: 150,
            responseBody: "OK"
        });

        expect(result.isOk()).toBe(true);
        expect(result.value.status).toBe("delivered");
        expect(result.value.responseStatus).toBe(200);
        expect(result.value.responseTime).toBe(150);
        expect(result.value.responseBody).toBe("OK");

        /* Verify persistence. */
        const getResult = await getUseCase.execute(delivery.id);
        expect(getResult.isOk()).toBe(true);
        expect(getResult.value.status).toBe("delivered");
        expect(getResult.value.responseStatus).toBe(200);
    });

    it("should update backgroundTaskId", async () => {
        const context = await handler.handle();
        const delivery = await createDelivery(context);
        const updateRepo = context.container.resolve(UpdateWebhookDeliveryRepository);

        const result = await updateRepo.execute(delivery.id, {
            backgroundTaskId: "task-42",
            status: "delivering"
        });

        expect(result.isOk()).toBe(true);
        expect(result.value.backgroundTaskId).toBe("task-42");
        expect(result.value.status).toBe("delivering");
    });

    it("should preserve unchanged fields", async () => {
        const context = await handler.handle();
        const delivery = await createDelivery(context);
        const updateRepo = context.container.resolve(UpdateWebhookDeliveryRepository);

        const result = await updateRepo.execute(delivery.id, {
            status: "failed"
        });

        expect(result.isOk()).toBe(true);
        expect(result.value.status).toBe("failed");
        expect(result.value.webhookId).toBe(delivery.webhookId);
        expect(result.value.eventType).toBe(delivery.eventType);
    });

    it("should fail when delivery does not exist", async () => {
        const context = await handler.handle();
        const updateRepo = context.container.resolve(UpdateWebhookDeliveryRepository);

        const result = await updateRepo.execute("nonexistent-id", {
            status: "failed"
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_DELIVERY_NOT_FOUND");
    });
});
