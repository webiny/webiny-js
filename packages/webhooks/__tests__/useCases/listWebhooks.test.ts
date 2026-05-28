import { describe, it, expect } from "vitest";
import { useHandler } from "~tests/helpers/useHandler.js";
import { CreateWebhookUseCase } from "~/api/features/CreateWebhook/abstractions.js";
import { ListWebhooksUseCase } from "~/api/features/ListWebhooks/abstractions.js";

describe("ListWebhooksUseCase", () => {
    const handler = useHandler();

    const createWebhook = async (context: any, name: string, enabled = false) => {
        const useCase = context.container.resolve(CreateWebhookUseCase);
        const result = await useCase.execute({
            name,
            endpointUrl: "https://example.com/hook",
            enabled,
            events: ["cms.entry.product.published"],
            signingSecret: "whsec_dGVzdHNlY3JldA=="
        });
        expect(result.isOk()).toBe(true);
        return result.value;
    };

    it("should list all webhooks", async () => {
        const context = await handler.handle();
        await createWebhook(context, "List Test One");
        await createWebhook(context, "List Test Two");

        const listUseCase = context.container.resolve(ListWebhooksUseCase);
        const result = await listUseCase.execute();

        expect(result.isOk()).toBe(true);
        expect(result.value.items.length).toBeGreaterThanOrEqual(2);
        expect(result.value.meta).toEqual(
            expect.objectContaining({
                totalCount: expect.any(Number),
                hasMoreItems: expect.any(Boolean)
            })
        );
    });

    it("should filter by enabled status", async () => {
        const context = await handler.handle();
        await createWebhook(context, "Enabled Webhook", true);
        await createWebhook(context, "Disabled Webhook", false);

        const listUseCase = context.container.resolve(ListWebhooksUseCase);
        const result = await listUseCase.execute({ where: { enabled: true } });

        expect(result.isOk()).toBe(true);
        for (const item of result.value.items) {
            expect(item.enabled).toBe(true);
        }
    });

    it("should return empty list when no webhooks exist", async () => {
        const context = await handler.handle();
        const listUseCase = context.container.resolve(ListWebhooksUseCase);

        const result = await listUseCase.execute();

        expect(result.isOk()).toBe(true);
        expect(result.value.items).toEqual([]);
        expect(result.value.meta.totalCount).toBe(0);
    });

    it("should fail when user has no read permission", async () => {
        const restrictedHandler = useHandler({
            permissions: [{ name: "some-other-permission" }]
        });
        const context = await restrictedHandler.handle();
        const listUseCase = context.container.resolve(ListWebhooksUseCase);

        const result = await listUseCase.execute();

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });
});
