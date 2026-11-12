import { describe, it, expect } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler.js";

const GET_SETTINGS = /* GraphQL */ `
    query GetWebhookSettings {
        webhooks {
            getSettings {
                data {
                    signingSecret
                    deliveryRetentionDays
                }
                error {
                    code
                }
            }
        }
    }
`;

const UPDATE_SETTINGS = /* GraphQL */ `
    mutation UpdateWebhookSettings($input: UpdateWebhookSettingsInput!) {
        webhooks {
            updateSettings(input: $input) {
                data {
                    deliveryRetentionDays
                }
                error {
                    code
                }
            }
        }
    }
`;

const SECRET = "test-global-signing-secret";

describe("Webhook settings GraphQL", () => {
    const setSecret = async () => {
        const handler = useGraphQLHandler();
        const [response] = await handler.invoke({
            body: {
                query: UPDATE_SETTINGS,
                variables: { input: { signingSecret: SECRET, deliveryRetentionDays: 7 } }
            }
        });
        expect(response.data.webhooks.updateSettings.error).toBeNull();
    };

    const getSettingsAs = async (permissions: { name: string; rwd?: string }[]) => {
        const handler = useGraphQLHandler({ permissions });
        const [response] = await handler.invoke({ body: { query: GET_SETTINGS } });
        return response.data.webhooks.getSettings;
    };

    it("should not return settings without webhook write access", async () => {
        await setSecret();

        for (const permissions of [
            [{ name: "cms.settings" }],
            [{ name: "webhooks.webhook", rwd: "r" }]
        ]) {
            const result = await getSettingsAs(permissions);
            expect(result.data).toBeNull();
            expect(result.error).toMatchObject({ code: "WEBHOOK_NOT_AUTHORIZED" });
        }
    });

    it("should return settings with webhook write access", async () => {
        await setSecret();

        const result = await getSettingsAs([{ name: "webhooks.webhook", rwd: "rw" }]);
        expect(result.error).toBeNull();
        expect(result.data).toEqual({ signingSecret: SECRET, deliveryRetentionDays: 7 });
    });
});
