import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { WebhookSignPayload } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookSignPayloadFeature } from "~/api/features/WebhookSignPayload/feature.js";

describe("WebhookSignPayload", () => {
    it("returns Stripe-format signature: t={timestamp},v1={hmac}", async () => {
        const container = new Container();
        WebhookSignPayloadFeature.register(container);

        const signer = container.resolve(WebhookSignPayload);

        const rawBody = '{"event":"test"}';
        const timestamp = 1700000000;
        const secret = "whsec_test_secret";
        const result = await signer.sign(rawBody, timestamp, secret);

        expect(result.hash).toMatch(/^t=1700000000,v1=[a-f0-9]{64}$/);
    });

    it("produces consistent signatures for the same input", async () => {
        const container = new Container();
        WebhookSignPayloadFeature.register(container);

        const signer = container.resolve(WebhookSignPayload);

        const sig1 = await signer.sign("body", 1000, "whsec_abc");
        const sig2 = await signer.sign("body", 1000, "whsec_abc");

        expect(sig1.hash).toBe(sig2.hash);
    });

    it("produces different signatures for different timestamps", async () => {
        const container = new Container();
        WebhookSignPayloadFeature.register(container);

        const signer = container.resolve(WebhookSignPayload);

        const sig1 = await signer.sign("body", 1000, "whsec_abc");
        const sig2 = await signer.sign("body", 2000, "whsec_abc");

        expect(sig1.hash).not.toBe(sig2.hash);
    });
});
