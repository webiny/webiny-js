import { describe, it, expect } from "vitest";
import { executeChain } from "~/features/events/chain.js";
import { ErrorHandler } from "~/features/http/handlers/ErrorHandler.js";
import { Container } from "@webiny/di";
import { EventHandler } from "~/features/events/EventHandler.js";
import type { IHttpRequest } from "~/features/http/abstractions.js";

const httpRequest: IHttpRequest = {
    method: "GET",
    path: "/test",
    headers: {},
    query: {},
    pathParameters: {},
    body: undefined
};

function resolveErrorHandler() {
    const container = new Container();
    container.register(ErrorHandler);
    return container.resolveAll(EventHandler);
}

describe("ErrorHandler", () => {
    it("should return 500 for errors on HTTP events", async () => {
        const handlers = [
            ...resolveErrorHandler(),
            {
                execute: async () => {
                    throw new Error("boom");
                }
            }
        ];

        const result = await executeChain(handlers, httpRequest);
        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body)).toEqual({ error: "Internal server error" });
    });

    it("should rethrow errors for non-HTTP events", async () => {
        const handlers = [
            ...resolveErrorHandler(),
            {
                execute: async () => {
                    throw new Error("s3 boom");
                }
            }
        ];

        await expect(executeChain(handlers, { Records: [] })).rejects.toThrow("s3 boom");
    });

    it("should pass through successful responses", async () => {
        const handlers = [
            ...resolveErrorHandler(),
            {
                execute: async () => ({ statusCode: 200, body: "ok" })
            }
        ];

        const result = await executeChain(handlers, httpRequest);
        expect(result.statusCode).toBe(200);
    });
});
