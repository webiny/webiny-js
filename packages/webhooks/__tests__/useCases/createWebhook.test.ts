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

    it("should allow HTTP for localhost during local development", async () => {
        process.env.WEBINY_WATCH_LOCAL_INVOCATION = "1";
        try {
            const context = await handler.handle();
            const useCase = context.container.resolve(CreateWebhookUseCase);

            const result = await useCase.execute({
                name: "Localhost Webhook",
                endpointUrl: "http://localhost:3000/hook",
                events: ["cms.entry.product.published"],
                signingSecret: "whsec_dGVzdHNlY3JldA=="
            });

            expect(result.isOk()).toBe(true);
        } finally {
            delete process.env.WEBINY_WATCH_LOCAL_INVOCATION;
        }
    });

    it.each([
        "http://localhost:3000/hook",
        "https://localhost/hook",
        "https://127.0.0.1/hook",
        "http://127.0.0.1:9001/2018-06-01/runtime/invocation/next",
        "https://169.254.169.254/latest",
        "https://[::1]/hook",
        "https://[fe80::1]/hook",
        "https://0.0.0.0/hook",
        "https://[::ffff:127.0.0.1]/hook",
        "https://[::ffff:169.254.169.254]/hook",
        "https://[::ffff:0:7f00:1]/hook",
        "https://2130706433/hook",
        "https://0x7f.1/hook"
    ])("should reject a local or link-local endpoint %s", async endpointUrl => {
        const context = await handler.handle();
        const useCase = context.container.resolve(CreateWebhookUseCase);

        const result = await useCase.execute({
            name: "Local Webhook",
            endpointUrl,
            events: ["cms.entry.product.published"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_VALIDATION_ERROR");
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
