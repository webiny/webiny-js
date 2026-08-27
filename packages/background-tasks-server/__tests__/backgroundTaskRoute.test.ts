import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core";
import { HttpRoute, invokeHttpRoute } from "@webiny/event-handler-core";
import type { IHttpRequest } from "@webiny/event-handler-core";
import { BackgroundTaskRoute } from "~/routes/BackgroundTaskRoute.js";
import { InternalToken } from "~/domain/InternalToken.js";

const TOKEN_VALUE = "valid-token-abc";

const createRouteInstance = (): HttpRoute.Interface => {
    const container = new Container();
    container.registerInstance(RequestContainer, container);
    container.registerInstance(InternalToken, { value: TOKEN_VALUE });
    container.register(BackgroundTaskRoute);
    return container.resolve(HttpRoute);
};

const makeRequest = (overrides: Partial<IHttpRequest> = {}): IHttpRequest => ({
    method: "POST",
    path: "/background-task",
    headers: {
        "content-type": "application/json",
        "x-webiny-background-task-token": TOKEN_VALUE
    },
    query: {},
    pathParameters: {},
    body: {
        webinyTaskId: "task-1",
        webinyTaskDefinitionId: "testDef",
        tenant: "root",
        delay: 0
    },
    ...overrides
});

describe("BackgroundTaskRoute", () => {
    it("should have correct method and path", () => {
        const route = createRouteInstance();

        expect(route.method).toBe("POST");
        expect(route.path).toBe("/background-task");
    });

    it("should reject requests without token header", async () => {
        const route = createRouteInstance();

        const request = makeRequest({
            headers: { "content-type": "application/json" }
        });

        const response = await invokeHttpRoute(route, request);

        expect(response.statusCode).toBe(403);
        expect(JSON.parse(response.body).error).toBe("Forbidden.");
    });

    it("should reject requests with wrong token", async () => {
        const route = createRouteInstance();

        const request = makeRequest({
            headers: {
                "content-type": "application/json",
                "x-webiny-background-task-token": "wrong-token"
            }
        });

        const response = await invokeHttpRoute(route, request);

        expect(response.statusCode).toBe(403);
    });

    it("should reject requests with null body", async () => {
        const route = createRouteInstance();

        const request = makeRequest({ body: null });

        const response = await invokeHttpRoute(route, request);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).error).toBe("Missing webinyTaskId in request body.");
    });

    it("should reject requests with empty body", async () => {
        const route = createRouteInstance();

        const request = makeRequest({ body: {} });

        const response = await invokeHttpRoute(route, request);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body).error).toBe("Missing webinyTaskId in request body.");
    });

    it("should reject requests missing webinyTaskId", async () => {
        const route = createRouteInstance();

        const request = makeRequest({
            body: { tenant: "root", definitionId: "test" }
        });

        const response = await invokeHttpRoute(route, request);

        expect(response.statusCode).toBe(400);
    });

    it("should pass validation with correct token and body", async () => {
        const route = createRouteInstance();

        const request = makeRequest();

        /* Passes token + body validation but fails deeper (container has no tenant/runner setup).
         * Expect 500, not 403 or 400 — proves validation layer works. */
        const response = await invokeHttpRoute(route, request);

        expect(response.statusCode).toBe(500);
        expect(JSON.parse(response.body).status).toBe("error");
    });
});
