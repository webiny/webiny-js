import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { WebhookSignPayload } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookSignPayloadFeature } from "~/api/features/WebhookSignPayload/feature.js";

// Standard Webhooks secrets are base64-encoded (optionally prefixed with "whsec_").
const SECRET = "whsec_dGVzdHNlY3JldA==";

describe("WebhookSignPayload", () => {
    it("returns Standard Webhooks headers for a signed payload", async () => {
        const container = new Container();
        WebhookSignPayloadFeature.register(container);

        const signer = container.resolve(WebhookSignPayload);

        const msgId = "msg_01abc";
        const timestamp = new Date("2024-01-01T00:00:00Z");
        const rawBody = '{"event":"test"}';

        const headers = await signer.sign(msgId, timestamp, rawBody, SECRET);

        expect(headers["webhook-id"]).toBe(msgId);
        expect(headers["webhook-timestamp"]).toBe(String(Math.floor(timestamp.getTime() / 1000)));
        expect(headers["webhook-signature"]).toMatch(/^v1,/);
    });

    it("produces consistent signatures for the same input", async () => {
        const container = new Container();
        WebhookSignPayloadFeature.register(container);

        const signer = container.resolve(WebhookSignPayload);

        const timestamp = new Date("2024-01-01T00:00:00Z");
        const h1 = await signer.sign("msg_1", timestamp, "body", SECRET);
        const h2 = await signer.sign("msg_1", timestamp, "body", SECRET);

        expect(h1["webhook-signature"]).toBe(h2["webhook-signature"]);
    });

    it("produces different signatures for different message IDs", async () => {
        const container = new Container();
        WebhookSignPayloadFeature.register(container);

        const signer = container.resolve(WebhookSignPayload);

        const timestamp = new Date("2024-01-01T00:00:00Z");
        const h1 = await signer.sign("msg_a", timestamp, "body", SECRET);
        const h2 = await signer.sign("msg_b", timestamp, "body", SECRET);

        expect(h1["webhook-signature"]).not.toBe(h2["webhook-signature"]);
    });

    it("signs with a plain-text secret that is not base64-encoded", async () => {
        const container = new Container();
        WebhookSignPayloadFeature.register(container);

        const signer = container.resolve(WebhookSignPayload);

        const timestamp = new Date("2024-01-01T00:00:00Z");
        const rawBody = '{"event":"cms.entry.article.created","data":{"id":"abc123"}}';

        const headers = await signer.sign("msg_plain", timestamp, rawBody, "my signing secret!");

        expect(headers["webhook-id"]).toBe("msg_plain");
        expect(headers["webhook-signature"]).toMatch(/^v1,/);
    });
});
