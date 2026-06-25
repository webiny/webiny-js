import { describe, it, expect } from "vitest";
import { ServerWebsocketsEventValidator } from "~/validator/ServerWebsocketsEventValidator.js";
import type { IWebsocketsEvent } from "@webiny/api-websockets";

const createConnectEvent = (): IWebsocketsEvent => ({
    headers: { host: "localhost:8080" },
    context: {
        connectionId: "conn-1",
        connectedAt: 1718000000000,
        host: "localhost",
        eventType: "connect",
        route: "connect",
        endpoint: "ws://localhost:8080"
    },
    body: undefined
});

const createMessageEvent = (action?: string): IWebsocketsEvent => ({
    headers: { host: "localhost:8080" },
    context: {
        connectionId: "conn-1",
        connectedAt: 1718000000000,
        host: "localhost",
        eventType: "message",
        route: "default",
        endpoint: "ws://localhost:8080"
    },
    body: {
        token: "my-token",
        tenant: "root",
        messageId: "msg-1",
        action,
        data: { key: "value" }
    }
});

const createDisconnectEvent = (): IWebsocketsEvent => ({
    headers: { host: "localhost:8080" },
    context: {
        connectionId: "conn-1",
        connectedAt: 1718000000000,
        host: "localhost",
        eventType: "disconnect",
        route: "disconnect",
        endpoint: "ws://localhost:8080"
    },
    body: undefined
});

describe("ServerWebsocketsEventValidator", () => {
    it("passes through a connect event unchanged", async () => {
        const validator = new ServerWebsocketsEventValidator();
        const event = createConnectEvent();

        const result = await validator.validate(event);

        expect(result.context.eventType).toBe("connect");
        expect(result.context.route).toBe("connect");
        expect(result.body).toBeUndefined();
    });

    it("passes through a message event with body", async () => {
        const validator = new ServerWebsocketsEventValidator();
        const event = createMessageEvent();

        const result = await validator.validate(event);

        expect(result.context.eventType).toBe("message");
        expect(result.body?.token).toBe("my-token");
        expect(result.body?.tenant).toBe("root");
        expect(result.body?.messageId).toBe("msg-1");
    });

    it("uses body.action as route when provided", async () => {
        const validator = new ServerWebsocketsEventValidator();
        const event = createMessageEvent("my-custom-action");

        const result = await validator.validate(event);

        expect(result.context.route).toBe("my-custom-action");
    });

    it("passes through a disconnect event unchanged", async () => {
        const validator = new ServerWebsocketsEventValidator();
        const event = createDisconnectEvent();

        const result = await validator.validate(event);

        expect(result.context.eventType).toBe("disconnect");
        expect(result.context.route).toBe("disconnect");
        expect(result.body).toBeUndefined();
    });

    it("throws a validation error when message event has no body", async () => {
        const validator = new ServerWebsocketsEventValidator();
        const event: IWebsocketsEvent = {
            headers: { host: "localhost:8080" },
            context: {
                connectionId: "conn-1",
                connectedAt: 1718000000000,
                host: "localhost",
                eventType: "message",
                route: "default",
                endpoint: "ws://localhost:8080"
            },
            body: undefined
        };

        await expect(validator.validate(event)).rejects.toMatchObject({
            message: "Validation failed.",
            code: "VALIDATION_FAILED_INVALID_FIELDS",
            data: {
                invalidFields: {
                    body: {
                        message: "Message event must have a body."
                    }
                }
            }
        });
    });
});
