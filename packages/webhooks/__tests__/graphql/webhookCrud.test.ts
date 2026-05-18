import { describe, it, expect } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler.js";
import { CREATE_WEBHOOK } from "./webhookQueries.js";
import { GET_WEBHOOK } from "./webhookQueries.js";
import { LIST_WEBHOOKS } from "./webhookQueries.js";
import { UPDATE_WEBHOOK } from "./webhookQueries.js";
import { DELETE_WEBHOOK } from "./webhookQueries.js";

const VALID_INPUT = {
    name: "Shop Sync",
    endpointUrl: "https://example.com/hook",
    events: ["cms.entry.product.published"],
    signingSecret: "whsec_dGVzdHNlY3JldA=="
};

describe("Webhook CRUD GraphQL", () => {
    const handler = useGraphQLHandler();

    it("should create a webhook via GraphQL", async () => {
        const [response] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });

        const result = response.data.webhooks.createWebhook;
        expect(result.error).toBeNull();
        expect(result.data).toMatchObject({
            name: "Shop Sync",
            slug: "shop-sync",
            endpointUrl: "https://example.com/hook",
            enabled: false,
            events: ["cms.entry.product.published"]
        });
        expect(result.data.id).toEqual(expect.any(String));
        expect(result.data.signingSecret).toEqual(expect.any(String));
    });

    it("should get a webhook by id via GraphQL", async () => {
        const [createResponse] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });
        const id = createResponse.data.webhooks.createWebhook.data.id;

        const [response] = await handler.invoke({
            body: {
                query: GET_WEBHOOK,
                variables: { id }
            }
        });

        const result = response.data.webhooks.getWebhook;
        expect(result.error).toBeNull();
        expect(result.data.id).toBe(id);
        expect(result.data.name).toBe("Shop Sync");
    });

    it("should return error when getting non-existent webhook", async () => {
        const [response] = await handler.invoke({
            body: {
                query: GET_WEBHOOK,
                variables: { id: "non-existent-id" }
            }
        });

        const result = response.data.webhooks.getWebhook;
        expect(result.data).toBeNull();
        expect(result.error).toBeTruthy();
        expect(result.error.code).toBe("WEBHOOK_NOT_FOUND");
    });

    it("should list webhooks via GraphQL", async () => {
        const [create1] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: {
                    input: {
                        ...VALID_INPUT,
                        name: "Webhook A"
                    }
                }
            }
        });
        expect(create1.data.webhooks.createWebhook.error).toBeNull();

        const [create2] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: {
                    input: {
                        ...VALID_INPUT,
                        name: "Webhook B",
                        slug: "webhook-b"
                    }
                }
            }
        });
        expect(create2.data.webhooks.createWebhook.error).toBeNull();

        const [response] = await handler.invoke({
            body: { query: LIST_WEBHOOKS }
        });

        const result = response.data.webhooks.listWebhooks;
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(2);
        expect(result.meta).toMatchObject({
            hasMoreItems: false,
            totalCount: 2
        });
    });

    it("should filter webhooks by enabled status", async () => {
        const [create1] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: {
                    input: {
                        ...VALID_INPUT,
                        name: "Enabled Hook",
                        enabled: true
                    }
                }
            }
        });
        expect(create1.data.webhooks.createWebhook.error).toBeNull();

        const [create2] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: {
                    input: {
                        ...VALID_INPUT,
                        name: "Disabled Hook",
                        slug: "disabled-hook",
                        enabled: false
                    }
                }
            }
        });
        expect(create2.data.webhooks.createWebhook.error).toBeNull();

        const [response] = await handler.invoke({
            body: {
                query: LIST_WEBHOOKS,
                variables: { where: { enabled: true } }
            }
        });

        const result = response.data.webhooks.listWebhooks;
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe("Enabled Hook");
    });

    it("should update a webhook via GraphQL", async () => {
        const [createResponse] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });
        const id = createResponse.data.webhooks.createWebhook.data.id;

        const [response] = await handler.invoke({
            body: {
                query: UPDATE_WEBHOOK,
                variables: {
                    id,
                    input: {
                        name: "Updated Name",
                        enabled: true
                    }
                }
            }
        });

        const result = response.data.webhooks.updateWebhook;
        expect(result.error).toBeNull();
        expect(result.data.name).toBe("Updated Name");
        expect(result.data.enabled).toBe(true);
        expect(result.data.endpointUrl).toBe("https://example.com/hook");
    });

    it("should return error when updating non-existent webhook", async () => {
        const [response] = await handler.invoke({
            body: {
                query: UPDATE_WEBHOOK,
                variables: {
                    id: "non-existent-id",
                    input: { name: "Nope" }
                }
            }
        });

        const result = response.data.webhooks.updateWebhook;
        expect(result.data).toBeNull();
        expect(result.error).toBeTruthy();
        expect(result.error.code).toBe("WEBHOOK_NOT_FOUND");
    });

    it("should delete a webhook via GraphQL", async () => {
        const [createResponse] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });
        const id = createResponse.data.webhooks.createWebhook.data.id;

        const [deleteResponse] = await handler.invoke({
            body: {
                query: DELETE_WEBHOOK,
                variables: { id }
            }
        });

        expect(deleteResponse.data.webhooks.deleteWebhook.data).toBe(true);
        expect(deleteResponse.data.webhooks.deleteWebhook.error).toBeNull();

        const [getResponse] = await handler.invoke({
            body: {
                query: GET_WEBHOOK,
                variables: { id }
            }
        });

        expect(getResponse.data.webhooks.getWebhook.data).toBeNull();
        expect(getResponse.data.webhooks.getWebhook.error.code).toBe("WEBHOOK_NOT_FOUND");
    });

    it("should return error when deleting non-existent webhook", async () => {
        const [response] = await handler.invoke({
            body: {
                query: DELETE_WEBHOOK,
                variables: { id: "non-existent-id" }
            }
        });

        const result = response.data.webhooks.deleteWebhook;
        expect(result.data).toBeNull();
        expect(result.error).toBeTruthy();
        expect(result.error.code).toBe("WEBHOOK_NOT_FOUND");
    });

    it("should reject duplicate slug via GraphQL", async () => {
        const [first] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });
        expect(first.data.webhooks.createWebhook.error).toBeNull();

        const [second] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });

        const result = second.data.webhooks.createWebhook;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_VALIDATION_ERROR");
        expect(result.error.message).toContain("already taken");
    });

    it("should reject non-HTTPS endpoint URL via GraphQL", async () => {
        const [response] = await handler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: {
                    input: {
                        ...VALID_INPUT,
                        endpointUrl: "http://external-server.com/hook"
                    }
                }
            }
        });

        const result = response.data.webhooks.createWebhook;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_VALIDATION_ERROR");
    });

    it("should fail create without write permission", async () => {
        const restrictedHandler = useGraphQLHandler({
            permissions: [{ name: "webhooks.webhook", rwd: "r" }]
        });

        const [response] = await restrictedHandler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });

        const result = response.data.webhooks.createWebhook;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });

    it("should fail list without read permission", async () => {
        const restrictedHandler = useGraphQLHandler({
            permissions: [{ name: "webhooks.webhook", rwd: "w" }]
        });

        const [response] = await restrictedHandler.invoke({
            body: { query: LIST_WEBHOOKS }
        });

        const result = response.data.webhooks.listWebhooks;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });

    it("should fail delete without delete permission", async () => {
        const createHandler = useGraphQLHandler();
        const [createResponse] = await createHandler.invoke({
            body: {
                query: CREATE_WEBHOOK,
                variables: { input: VALID_INPUT }
            }
        });
        const id = createResponse.data.webhooks.createWebhook.data.id;

        const restrictedHandler = useGraphQLHandler({
            permissions: [{ name: "webhooks.webhook", rwd: "rw" }]
        });

        const [response] = await restrictedHandler.invoke({
            body: {
                query: DELETE_WEBHOOK,
                variables: { id }
            }
        });

        const result = response.data.webhooks.deleteWebhook;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });
});
