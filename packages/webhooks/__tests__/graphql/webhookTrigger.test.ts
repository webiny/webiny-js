import { describe, it, expect } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler.js";
import { CREATE_WEBHOOK } from "./webhookQueries.js";
import { TRIGGER_WEBHOOK } from "./triggerQueries.js";

const VALID_INPUT = {
    name: "Trigger Test Hook",
    endpointUrl: "https://example.com/hook",
    events: ["cms.entry.product.published"],
    signingSecret: "whsec_dGVzdHNlY3JldA=="
};

describe("Webhook Trigger GraphQL", () => {
    const handler = useGraphQLHandler();

    it("should trigger a webhook and create a delivery", async () => {
        const [createRes] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });
        const webhookId = createRes.data.webhooks.createWebhook.data.id;

        const [response] = await handler.invoke({
            body: {
                query: TRIGGER_WEBHOOK,
                variables: {
                    id: webhookId,
                    payload: { test: "data" }
                }
            }
        });

        const result = response.data.webhooks.triggerWebhook;
        expect(result.error).toBeNull();
        expect(result.data).toMatchObject({
            webhookId,
            eventType: "webhook.test",
            status: "pending"
        });
        expect(result.data.id).toEqual(expect.any(String));

        expect(handler.noopTaskService.triggered).toHaveLength(1);
    });

    it("should return error for non-existent webhook", async () => {
        const [response] = await handler.invoke({
            body: {
                query: TRIGGER_WEBHOOK,
                variables: {
                    id: "non-existent-id",
                    payload: { test: true }
                }
            }
        });

        const result = response.data.webhooks.triggerWebhook;
        expect(result.data).toBeNull();
        expect(result.error).toBeTruthy();
        expect(result.error.code).toBe("WEBHOOK_NOT_FOUND");
    });

    it("should fail without write permission", async () => {
        const createHandler = useGraphQLHandler();
        const [createRes] = await createHandler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });
        const webhookId = createRes.data.webhooks.createWebhook.data.id;

        const restrictedHandler = useGraphQLHandler({
            permissions: [{ name: "webhooks.webhook", rwd: "r" }]
        });

        const [response] = await restrictedHandler.invoke({
            body: {
                query: TRIGGER_WEBHOOK,
                variables: {
                    id: webhookId,
                    payload: { test: true }
                }
            }
        });

        const result = response.data.webhooks.triggerWebhook;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });
});
