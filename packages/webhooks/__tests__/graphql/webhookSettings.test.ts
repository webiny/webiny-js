import { describe, it, expect } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler.js";
import { GET_SETTINGS, UPDATE_SETTINGS } from "./settingsQueries.js";

const SECRET = "whsec_dGVzdHNlY3JldA==";

const identityB = {
    id: "id-other-user",
    type: "admin",
    displayName: "Other User"
};

const setSecret = async () => {
    const adminHandler = useGraphQLHandler();
    const [response] = await adminHandler.invoke({
        body: {
            query: UPDATE_SETTINGS,
            variables: { input: { signingSecret: SECRET, deliveryRetentionDays: 7 } }
        }
    });
    const result = response.data.webhooks.updateSettings;
    expect(result.error).toBeNull();
    expect(result.data.signingSecret).toBe(SECRET);
};

describe("Webhook settings GraphQL", () => {
    it("should refuse getSettings for an anonymous caller", async () => {
        await setSecret();

        const anonymousHandler = useGraphQLHandler({ anonymous: true });
        const [response] = await anonymousHandler.invoke({ body: { query: GET_SETTINGS } });

        const result = response.data.webhooks.getSettings;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });

    it("should refuse getSettings for a logged-in user without webhook permissions", async () => {
        await setSecret();

        const handler = useGraphQLHandler({ identity: identityB, permissions: [] });
        const [response] = await handler.invoke({ body: { query: GET_SETTINGS } });

        const result = response.data.webhooks.getSettings;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });

    it("should refuse getSettings for a user with read-only webhook permission", async () => {
        await setSecret();

        const handler = useGraphQLHandler({
            identity: identityB,
            permissions: [{ name: "webhooks.webhook", rwd: "r" }]
        });
        const [response] = await handler.invoke({ body: { query: GET_SETTINGS } });

        const result = response.data.webhooks.getSettings;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_NOT_AUTHORIZED");
    });

    it("should return settings, signing secret included, to a user who can edit webhooks", async () => {
        await setSecret();

        const handler = useGraphQLHandler({
            identity: identityB,
            permissions: [{ name: "webhooks.webhook", rwd: "rw" }]
        });
        const [response] = await handler.invoke({ body: { query: GET_SETTINGS } });

        const result = response.data.webhooks.getSettings;
        expect(result.error).toBeNull();
        expect(result.data).toEqual({
            signingSecret: SECRET,
            deliveryRetentionDays: 7
        });
    });

    it("should return null signing secret when none is set", async () => {
        const handler = useGraphQLHandler();
        const [response] = await handler.invoke({ body: { query: GET_SETTINGS } });

        const result = response.data.webhooks.getSettings;
        expect(result.error).toBeNull();
        expect(result.data.signingSecret).toBeNull();
    });

    it("should reject a whsec_ signing secret that is not base64", async () => {
        const handler = useGraphQLHandler();
        const [response] = await handler.invoke({
            body: {
                query: UPDATE_SETTINGS,
                variables: { input: { signingSecret: "whsec_not base64!" } }
            }
        });

        const result = response.data.webhooks.updateSettings;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("WEBHOOK_VALIDATION_ERROR");
    });
});
