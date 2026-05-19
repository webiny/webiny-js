import { describe, it, expect } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler.js";
import { CREATE_WEBHOOK } from "./webhookQueries.js";
import { TRIGGER_WEBHOOK } from "./triggerQueries.js";
import { LIST_WEBHOOK_DELIVERIES } from "./deliveryQueries.js";
import { GET_WEBHOOK_DELIVERY } from "./deliveryQueries.js";
import { RESEND_WEBHOOK_DELIVERY } from "./deliveryQueries.js";

const VALID_INPUT = {
    name: "Delivery Test Hook",
    endpointUrl: "https://example.com/hook",
    events: ["cms.entry.product.published"],
    signingSecret: "whsec_dGVzdHNlY3JldA=="
};

describe("Webhook Deliveries GraphQL", () => {
    const handler = useGraphQLHandler();

    const createWebhookAndTrigger = async () => {
        const [createRes] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });
        const webhookId = createRes.data.webhooks.createWebhook.data.id;

        const [triggerRes] = await handler.invoke({
            body: {
                query: TRIGGER_WEBHOOK,
                variables: {
                    id: webhookId,
                    payload: { test: true }
                }
            }
        });
        const delivery = triggerRes.data.webhooks.triggerWebhook.data;

        return { webhookId, delivery };
    };

    it("should list deliveries for a webhook", async () => {
        const { webhookId } = await createWebhookAndTrigger();

        const [response] = await handler.invoke({
            body: {
                query: LIST_WEBHOOK_DELIVERIES,
                variables: { webhookId }
            }
        });

        const result = response.data.webhooks.listWebhookDeliveries;
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(1);
        expect(result.data[0].webhookId).toBe(webhookId);
        expect(result.data[0].status).toBe("pending");
        expect(result.meta.totalCount).toBe(1);
    });

    it("should return empty list for webhook with no deliveries", async () => {
        const [createRes] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: { ...VALID_INPUT, slug: "no-deliveries-hook" } }
            }
        });
        const webhookId = createRes.data.webhooks.createWebhook.data.id;

        const [response] = await handler.invoke({
            body: {
                query: LIST_WEBHOOK_DELIVERIES,
                variables: { webhookId }
            }
        });

        const result = response.data.webhooks.listWebhookDeliveries;
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(0);
        expect(result.meta.totalCount).toBe(0);
    });

    it("should get a single delivery by id", async () => {
        const { delivery } = await createWebhookAndTrigger();

        const [response] = await handler.invoke({
            body: {
                query: GET_WEBHOOK_DELIVERY,
                variables: { id: delivery.id }
            }
        });

        const result = response.data.webhooks.getWebhookDelivery;
        expect(result.error).toBeNull();
        expect(result.data.id).toBe(delivery.id);
        expect(result.data.eventType).toBe("webhook.test");
        expect(result.data.status).toBe("pending");
    });

    it("should return error for non-existent delivery", async () => {
        const [response] = await handler.invoke({
            body: {
                query: GET_WEBHOOK_DELIVERY,
                variables: { id: "non-existent-id" }
            }
        });

        const result = response.data.webhooks.getWebhookDelivery;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_DELIVERY_NOT_FOUND");
    });

    it("should resend a delivery", async () => {
        const { delivery } = await createWebhookAndTrigger();

        const [response] = await handler.invoke({
            body: {
                query: RESEND_WEBHOOK_DELIVERY,
                variables: { id: delivery.id }
            }
        });

        const result = response.data.webhooks.resendWebhookDelivery;
        expect(result.error).toBeNull();
        expect(result.data).toBe(true);
    });
});
