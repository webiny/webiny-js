import { describe, it, expect } from "vitest";
import { useHandler } from "~tests/helpers/useHandler.js";
import { CreateWebhookUseCase } from "~/api/features/CreateWebhook/abstractions.js";
import { UpdateWebhookUseCase } from "~/api/features/UpdateWebhook/abstractions.js";
import { GetWebhookUseCase } from "~/api/features/GetWebhook/abstractions.js";

describe("UpdateWebhookUseCase", () => {
    const handler = useHandler();

    const createWebhook = async (context: any) => {
        const useCase = context.container.resolve(CreateWebhookUseCase);
        const result = await useCase.execute({
            name: "Update Test Webhook",
            endpointUrl: "https://example.com/hook",
            events: ["cms.entry.product.published"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });
        expect(result.isOk()).toBe(true);
        return result.value;
    };

    it("should update webhook fields and persist them", async () => {
        const context = await handler.handle();
        const webhook = await createWebhook(context);
        const updateUseCase = context.container.resolve(UpdateWebhookUseCase);
        const getUseCase = context.container.resolve(GetWebhookUseCase);

        const result = await updateUseCase.execute(webhook.id, {
            name: "Updated Webhook Name",
            enabled: true,
            events: ["cms.entry.product.published", "cms.entry.product.created"]
        });

        expect(result.isOk()).toBe(true);
        expect(result.value.name).toBe("Updated Webhook Name");
        expect(result.value.enabled).toBe(true);
        expect(result.value.events).toEqual([
            "cms.entry.product.published",
            "cms.entry.product.created"
        ]);

        /* Verify persistence. */
        const getResult = await getUseCase.execute(webhook.id);
        expect(getResult.isOk()).toBe(true);
        expect(getResult.value.name).toBe("Updated Webhook Name");
        expect(getResult.value.enabled).toBe(true);
    });

    it("should only update provided fields, leaving others unchanged", async () => {
        const context = await handler.handle();
        const webhook = await createWebhook(context);
        const updateUseCase = context.container.resolve(UpdateWebhookUseCase);

        const result = await updateUseCase.execute(webhook.id, {
            description: "New description"
        });

        expect(result.isOk()).toBe(true);
        expect(result.value.description).toBe("New description");
        expect(result.value.name).toBe("Update Test Webhook");
        expect(result.value.endpointUrl).toBe("https://example.com/hook");
    });

    it("should reject non-HTTPS endpoint URL on update", async () => {
        const context = await handler.handle();
        const webhook = await createWebhook(context);
        const updateUseCase = context.container.resolve(UpdateWebhookUseCase);

        const result = await updateUseCase.execute(webhook.id, {
            endpointUrl: "http://external.com/hook"
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_VALIDATION_ERROR");
    });

    it("should reject empty events array on update", async () => {
        const context = await handler.handle();
        const webhook = await createWebhook(context);
        const updateUseCase = context.container.resolve(UpdateWebhookUseCase);

        const result = await updateUseCase.execute(webhook.id, {
            events: []
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_VALIDATION_ERROR");
    });

    it("should fail when webhook does not exist", async () => {
        const context = await handler.handle();
        const updateUseCase = context.container.resolve(UpdateWebhookUseCase);

        const result = await updateUseCase.execute("nonexistent-id", {
            name: "Nope"
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_NOT_FOUND");
    });

    it("should fail when user has no edit permission", async () => {
        const restrictedHandler = useHandler({
            permissions: [{ name: "webhooks.webhook", rwd: "r" }]
        });
        const context = await restrictedHandler.handle();
        const updateUseCase = context.container.resolve(UpdateWebhookUseCase);

        const result = await updateUseCase.execute("any-id", { name: "Nope" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });
});
