import { describe, it, expect } from "vitest";
import { Container } from "@webiny/feature/api";
import {
    WebhookSignPayload,
    WebhookVerifyPayload
} from "@webiny/api-core/features/webhooks/index.js";
import { WebhookSignPayloadFeature } from "~/api/features/WebhookSignPayload/feature.js";
import { WebhookVerifyPayloadFeature } from "~/api/features/WebhookVerifyPayload/feature.js";

const SECRET = "whsec_dGVzdHNlY3JldA==";

const makeContainer = () => {
    const container = new Container();
    WebhookSignPayloadFeature.register(container);
    WebhookVerifyPayloadFeature.register(container);
    return container;
};

describe("WebhookVerifyPayload", () => {
    it("returns the parsed payload for a valid signature", async () => {
        const container = makeContainer();
        const signer = container.resolve(WebhookSignPayload);
        const verifier = container.resolve(WebhookVerifyPayload);

        const msgId = "msg_01abc";
        const timestamp = new Date();
        const body = JSON.stringify({ event: "user.created", data: { id: "123" } });

        const headers = await signer.sign(msgId, timestamp, body, SECRET);
        const result = await verifier.verify(body, headers, SECRET);

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({ event: "user.created", data: { id: "123" } });
    });

    it("returns failure when the payload has been tampered with", async () => {
        const container = makeContainer();
        const signer = container.resolve(WebhookSignPayload);
        const verifier = container.resolve(WebhookVerifyPayload);

        const msgId = "msg_01abc";
        const timestamp = new Date();
        const body = JSON.stringify({ event: "user.created" });

        const headers = await signer.sign(msgId, timestamp, body, SECRET);
        const result = await verifier.verify('{"tampered":true}', headers, SECRET);

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toMatch(/signature/i);
    });

    it("returns failure when the wrong secret is used for verification", async () => {
        const container = makeContainer();
        const signer = container.resolve(WebhookSignPayload);
        const verifier = container.resolve(WebhookVerifyPayload);

        const timestamp = new Date();
        const body = JSON.stringify({ event: "user.created" });

        const headers = await signer.sign("msg_01abc", timestamp, body, SECRET);
        const result = await verifier.verify(body, headers, "whsec_d3JvbmdzZWNyZXQ=");

        expect(result.isFail()).toBe(true);
    });
});
