import { describe, it, expect } from "vitest";
import { useHandler } from "~tests/helpers/useHandler.js";
import { CreateWebhookUseCase } from "~/api/features/CreateWebhook/abstractions.js";
import { DeleteWebhookUseCase } from "~/api/features/DeleteWebhook/abstractions.js";
import { GetWebhookUseCase } from "~/api/features/GetWebhook/abstractions.js";

describe("DeleteWebhookUseCase", () => {
    const handler = useHandler();

    const createWebhook = async (context: any) => {
        const useCase = context.container.resolve(CreateWebhookUseCase);
        const result = await useCase.execute({
            name: "Delete Test Webhook",
            endpointUrl: "https://example.com/hook",
            events: ["cms.entry.product.published"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });
        expect(result.isOk()).toBe(true);
        return result.value;
    };

    it("should delete a webhook and remove it from storage", async () => {
        const context = await handler.handle();
        const webhook = await createWebhook(context);
        const deleteUseCase = context.container.resolve(DeleteWebhookUseCase);
        const getUseCase = context.container.resolve(GetWebhookUseCase);

        const result = await deleteUseCase.execute(webhook.id);
        expect(result.isOk()).toBe(true);
        expect(result.value).toBe(true);

        /* Verify it's gone. */
        const getResult = await getUseCase.execute(webhook.id);
        expect(getResult.isFail()).toBe(true);
        expect(getResult.error.code).toBe("WEBHOOK_NOT_FOUND");
    });

    it("should fail when webhook does not exist", async () => {
        const context = await handler.handle();
        const deleteUseCase = context.container.resolve(DeleteWebhookUseCase);

        const result = await deleteUseCase.execute("nonexistent-id");

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_NOT_FOUND");
    });

    it("should fail when user has no delete permission", async () => {
        const restrictedHandler = useHandler({
            permissions: [{ name: "webhooks.webhook", rwd: "rw" }]
        });
        const context = await restrictedHandler.handle();
        const deleteUseCase = context.container.resolve(DeleteWebhookUseCase);

        const result = await deleteUseCase.execute("any-id");

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });
});
