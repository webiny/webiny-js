import { describe, it, expect } from "vitest";
import { useHandler } from "~tests/helpers/useHandler.js";
import { CreateWebhookUseCase } from "~/api/features/CreateWebhook/abstractions.js";
import { GetWebhookUseCase } from "~/api/features/GetWebhook/abstractions.js";

describe("CreateWebhookUseCase", () => {
    const handler = useHandler();

    it("should create a webhook and persist it to storage", async () => {
        const context = await handler.handle();
        const createUseCase = context.container.resolve(CreateWebhookUseCase);
        const getUseCase = context.container.resolve(GetWebhookUseCase);

        const result = await createUseCase.execute({
            name: "Shop Sync",
            endpointUrl: "https://example.com/hook",
            events: ["cms.entry.product.published"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });

        expect(result.isOk()).toBe(true);

        const webhook = result.value;
        expect(webhook.name).toBe("Shop Sync");
        expect(webhook.slug).toBe("shop-sync");
        expect(webhook.endpointUrl).toBe("https://example.com/hook");
        expect(webhook.enabled).toBe(false);
        expect(webhook.events).toEqual(["cms.entry.product.published"]);
        expect(webhook.id).toEqual(expect.any(String));

        /* Verify it was persisted — read it back. */
        const getResult = await getUseCase.execute(webhook.id);
        expect(getResult.isOk()).toBe(true);
        expect(getResult.value.name).toBe("Shop Sync");
        expect(getResult.value.slug).toBe("shop-sync");
    });

    it("should auto-generate slug from name", async () => {
        const context = await handler.handle();
        const useCase = context.container.resolve(CreateWebhookUseCase);

        const result = await useCase.execute({
            name: "My Awesome Webhook!!!",
            endpointUrl: "https://example.com/hook",
            events: ["cms.entry.product.published"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });

        expect(result.isOk()).toBe(true);
        expect(result.value.slug).toBe("my-awesome-webhook");
    });

    it("should use provided slug when given", async () => {
        const context = await handler.handle();
        const useCase = context.container.resolve(CreateWebhookUseCase);

        const result = await useCase.execute({
            name: "Custom Slug Test",
            slug: "my-custom-slug",
            endpointUrl: "https://example.com/hook",
            events: ["cms.entry.product.published"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });

        expect(result.isOk()).toBe(true);
        expect(result.value.slug).toBe("my-custom-slug");
    });

    it("should reject duplicate slug", async () => {
        const context = await handler.handle();
        const useCase = context.container.resolve(CreateWebhookUseCase);

        const first = await useCase.execute({
            name: "Duplicate Slug",
            endpointUrl: "https://example.com/hook",
            events: ["cms.entry.product.published"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });
        expect(first.isOk()).toBe(true);
        expect(first.value.slug).toBe("duplicate-slug");

        const second = await useCase.execute({
            name: "Duplicate Slug",
            endpointUrl: "https://example.com/hook2",
            events: ["cms.entry.product.published"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });
        expect(second.isFail()).toBe(true);
        expect(second.error.code).toBe("WEBHOOK_VALIDATION_ERROR");
        expect(second.error.message).toContain("already taken");
    });

    it("should reject non-HTTPS endpoint URLs", async () => {
        const context = await handler.handle();
        const useCase = context.container.resolve(CreateWebhookUseCase);

        const result = await useCase.execute({
            name: "Bad URL",
            endpointUrl: "http://external-server.com/hook",
            events: ["cms.entry.product.published"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_VALIDATION_ERROR");
    });

    it("should allow HTTP for localhost", async () => {
        const context = await handler.handle();
        const useCase = context.container.resolve(CreateWebhookUseCase);

        const result = await useCase.execute({
            name: "Localhost Webhook",
            endpointUrl: "http://localhost:3000/hook",
            events: ["cms.entry.product.published"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });

        expect(result.isOk()).toBe(true);
    });

    it("should reject when no events are provided", async () => {
        const context = await handler.handle();
        const useCase = context.container.resolve(CreateWebhookUseCase);

        const result = await useCase.execute({
            name: "No Events",
            endpointUrl: "https://example.com/hook",
            events: [],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_VALIDATION_ERROR");
    });

    it("should fail when user has no create permission", async () => {
        const restrictedHandler = useHandler({
            permissions: [{ name: "webhooks.webhook", rwd: "r" }]
        });
        const context = await restrictedHandler.handle();
        const useCase = context.container.resolve(CreateWebhookUseCase);

        const result = await useCase.execute({
            name: "No Permission",
            endpointUrl: "https://example.com/hook",
            events: ["cms.entry.product.published"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });
});
