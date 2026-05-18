import { describe, it, expect } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler.js";
import { LIST_AVAILABLE_WEBHOOK_EVENTS } from "./eventQueries.js";

describe("Webhook Events GraphQL", () => {
    it("should list available webhook events", async () => {
        const handler = useGraphQLHandler();

        const [response] = await handler.invoke({
            body: { query: LIST_AVAILABLE_WEBHOOK_EVENTS }
        });

        const result = response.data.webhooks.listAvailableWebhookEvents;
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(3);
        expect(result.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    app: "cms",
                    entity: "product",
                    eventName: "cms.entry.product.created"
                }),
                expect.objectContaining({
                    app: "cms",
                    entity: "product",
                    eventName: "cms.entry.product.published"
                }),
                expect.objectContaining({
                    app: "wb",
                    entity: "page",
                    eventName: "wb.page.published"
                })
            ])
        );
    });

    it("should fail without read permission", async () => {
        const handler = useGraphQLHandler({
            permissions: [{ name: "webhooks.webhook", rwd: "w" }]
        });

        const [response] = await handler.invoke({
            body: { query: LIST_AVAILABLE_WEBHOOK_EVENTS }
        });

        const result = response.data.webhooks.listAvailableWebhookEvents;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });
});
