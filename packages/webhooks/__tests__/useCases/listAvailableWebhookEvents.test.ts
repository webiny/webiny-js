import { describe, it, expect } from "vitest";
import { useHandler } from "~tests/helpers/useHandler.js";
import { ListAvailableWebhookEventsUseCase } from "~/api/features/ListAvailableWebhookEvents/abstractions.js";
import { TEST_EVENTS } from "~tests/helpers/TestWebhookProvider.js";

describe("ListAvailableWebhookEventsUseCase", () => {
    const handler = useHandler();

    it("should return events from the provider", async () => {
        const context = await handler.handle();
        const useCase = context.container.resolve(ListAvailableWebhookEventsUseCase);

        const result = await useCase.execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual(TEST_EVENTS);
    });

    it("should fail when user has no read permission", async () => {
        const restrictedHandler = useHandler({
            permissions: [{ name: "some-other-permission" }]
        });
        const context = await restrictedHandler.handle();
        const useCase = context.container.resolve(ListAvailableWebhookEventsUseCase);

        const result = await useCase.execute();

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });
});
