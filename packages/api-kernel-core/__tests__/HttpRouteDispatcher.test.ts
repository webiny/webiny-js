import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { HttpRouteDispatcher, HttpRouter } from "~/features/http/abstractions.js";
import type { IHttpRequest } from "~/features/http/abstractions.js";
import { HttpFeature } from "~/features/http/feature.js";
import { registerHttpRouteInstance } from "~/features/testing/index.js";
import { RequestContainer } from "~/features/kernel/RequestContainer.js";

const request = (method: string, path: string): IHttpRequest => ({
    method,
    path,
    headers: { origin: "https://admin.example.com" },
    query: {},
    pathParameters: {},
    body: undefined
});

/*
 * HttpFeature registers the route matcher twice: as HttpRouter, behind the errors, CORS and
 * compression decorators, and as HttpRouteDispatcher, which a composition resolves from another
 * container (a tenant's scope) once it has replaced HttpRouter's implementation with a hand-off.
 */
describe("HttpRouteDispatcher", () => {
    function setup() {
        const container = new Container();
        HttpFeature.register(container);
        container.registerInstance(RequestContainer, container);
        registerHttpRouteInstance(container, {
            method: "GET",
            path: "/hello",
            route: {
                async handle() {
                    return { statusCode: 200, body: "hello" };
                }
            }
        });
        return container;
    }

    it("runs the matched route, without HttpRouter's decorators", async () => {
        const container = setup();

        const response = await container
            .resolve(HttpRouteDispatcher)
            .route(request("GET", "/hello"));

        expect(response).toEqual({ statusCode: 200, body: "hello" });
    });

    it("is what a replacement HttpRouter hands the request to, inside HttpRouter's decorators", async () => {
        const container = setup();
        const scope = container.createChildContainer();
        scope.registerInstance(RequestContainer, scope);
        container.registerInstance(HttpRouter, {
            route: req => scope.resolve(HttpRouteDispatcher).route(req)
        });

        const routed = await container.resolve(HttpRouter).route(request("GET", "/hello"));
        const preflight = await container.resolve(HttpRouter).route(request("OPTIONS", "/hello"));

        expect(routed.body).toBe("hello");
        expect(routed.headers).toMatchObject({
            "access-control-allow-origin": "https://admin.example.com"
        });
        expect(preflight.statusCode).toBe(204);
    });
});
