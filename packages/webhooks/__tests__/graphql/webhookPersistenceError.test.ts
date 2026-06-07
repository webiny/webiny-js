import { describe, it, expect } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler.js";
import { CREATE_WEBHOOK } from "./webhookQueries.js";
import { createRegisterExtensionPlugin } from "@webiny/handler/plugins/RegisterExtensionPlugin.js";
import { CreateWebhookRepository } from "~/api/features/CreateWebhook/abstractions.js";
import { Result } from "@webiny/feature/api";
import { WebhookPersistenceError } from "~/api/domain/errors.js";

const VALID_INPUT = {
    name: "Shop Sync",
    endpointUrl: "https://example.com/hook",
    events: ["cms.entry.product.published"],
    signingSecret: "whsec_dGVzdHNlY3JldA=="
};

describe("Webhook persistence error in GraphQL", () => {
    it("should return data and stack fields on WEBHOOK_PERSISTENCE_ERROR", async () => {
        const originalDebug = process.env.DEBUG;
        process.env.DEBUG = "true";

        try {
            const cause = new Error("Connection refused");
            (cause as any).code = "ECONNREFUSED";
            (cause as any).data = { host: "localhost", port: 5432 };

            const handler = useGraphQLHandler({
                plugins: [
                    createRegisterExtensionPlugin(context => {
                        context.container.registerInstance(CreateWebhookRepository, {
                            execute: async () => {
                                return Result.fail(WebhookPersistenceError.from(cause));
                            }
                        });
                    })
                ]
            });

            const [response] = await handler.invoke({
                body: {
                    query: CREATE_WEBHOOK,
                    variables: { input: VALID_INPUT }
                }
            });

            const result = response.data.webhooks.createWebhook;
            expect(result.data).toBeNull();
            expect(result.error.code).toBe("WEBHOOK_PERSISTENCE_ERROR");
            expect(result.error.message).toBe("Connection refused");
            expect(result.error.data).toMatchObject({
                originalMessage: "Connection refused",
                originalCode: "ECONNREFUSED",
                originalData: { host: "localhost", port: 5432 }
            });
            expect(result.error.stack).toEqual(
                expect.stringContaining("Error: Connection refused")
            );
        } finally {
            process.env.DEBUG = originalDebug;
        }
    });
});
