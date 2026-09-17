/**
 * Guards the wiring the `Api.Route` extension generates.
 *
 * The extension emits a `createHttpRouteDefinition({ method, path, handler })` registration into the
 * project's `extensions.ts`. Nothing in this repo runs that generated code, so the only protection
 * against it being wrong is testing the shape it produces — and it HAS been wrong: the extension
 * used to register the handler alone, which leaves the route unreachable. The route deploys, API
 * Gateway forwards the request, and dispatch finds nothing to match.
 */
import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { HttpRouteDefinition, HttpRouteHandler, HttpRouter } from "~/features/http/abstractions.js";
import { createHttpRouteDefinition } from "~/features/http/createHttpRouteDefinition.js";
import { RequestContainer } from "~/features/events/RequestContainer.js";
import { HttpRouterImpl } from "~/features/http/HttpRouter.js";
import type { IHttpRequest, IHttpResponse } from "~/features/http/abstractions.js";

const req = (method: string, path: string): IHttpRequest => ({
    method,
    path,
    headers: {},
    query: {},
    pathParameters: {},
    body: undefined
});

/** A handler declared the way a project's `src` file declares one. */
const makeHandler = (onHandle: (request: IHttpRequest) => IHttpResponse) => {
    class ProjectRouteImpl implements HttpRouteHandler.Interface {
        async handle(request: IHttpRequest): Promise<IHttpResponse> {
            return onHandle(request);
        }
    }

    return HttpRouteHandler.createImplementation({
        implementation: ProjectRouteImpl,
        dependencies: []
    });
};

const makeRouter = (register: (container: Container) => void) => {
    const container = new Container();
    register(container);
    container.register(HttpRouterImpl);
    container.registerInstance(RequestContainer, container);
    return container.resolve(HttpRouter);
};

describe("createHttpRouteDefinition", () => {
    it("makes the route reachable through the router", async () => {
        const handler = makeHandler(() => ({ statusCode: 200, body: "ok" }));

        const router = makeRouter(container => {
            container.register(
                createHttpRouteDefinition({ method: "POST", path: "/my-route", handler })
            );
        });

        const result = await router.route(req("POST", "/my-route"));

        expect(result.body).toBe("ok");
    });

    it("passes path parameters to the handler", async () => {
        const handler = makeHandler(request => ({
            statusCode: 200,
            body: request.pathParameters["orderId"]
        }));

        const router = makeRouter(container => {
            container.register(
                createHttpRouteDefinition({
                    method: "GET",
                    // The extension converts the prop to the router's syntax before emitting it.
                    path: "/orders/:orderId",
                    handler
                })
            );
        });

        const result = await router.route(req("GET", "/orders/abc123"));

        expect(result.body).toBe("abc123");
    });

    it("does not build the handler until the route matches", async () => {
        const built = vi.fn();

        class ProjectRouteImpl implements HttpRouteHandler.Interface {
            constructor() {
                built();
            }
            async handle(): Promise<IHttpResponse> {
                return { statusCode: 200, body: "ok" };
            }
        }

        const handler = HttpRouteHandler.createImplementation({
            implementation: ProjectRouteImpl,
            dependencies: []
        });

        const router = makeRouter(container => {
            container.register(
                createHttpRouteDefinition({ method: "POST", path: "/my-route", handler })
            );
        });

        await expect(router.route(req("GET", "/somewhere-else"))).rejects.toThrow(
            "Route not found"
        );
        expect(built).not.toHaveBeenCalled();

        await router.route(req("POST", "/my-route"));
        expect(built).toHaveBeenCalledOnce();
    });

    it("registering only the handler leaves the route unreachable", async () => {
        // This is the bug the extension shipped. Kept as a test so the failure mode is documented
        // rather than rediscovered: a handler with no definition is invisible to the router.
        const handler = makeHandler(() => ({ statusCode: 200, body: "ok" }));

        const router = makeRouter(container => {
            container.register(handler);
        });

        await expect(router.route(req("POST", "/my-route"))).rejects.toThrow("Route not found");
    });

    it("registers under HttpRouteDefinition, so several routes coexist", async () => {
        const first = makeHandler(() => ({ statusCode: 200, body: "first" }));
        const second = makeHandler(() => ({ statusCode: 200, body: "second" }));

        const container = new Container();
        container.register(
            createHttpRouteDefinition({ method: "GET", path: "/first", handler: first })
        );
        container.register(
            createHttpRouteDefinition({ method: "GET", path: "/second", handler: second })
        );

        expect(container.resolveAll(HttpRouteDefinition)).toHaveLength(2);

        container.register(HttpRouterImpl);
        container.registerInstance(RequestContainer, container);
        const router = container.resolve(HttpRouter);

        expect((await router.route(req("GET", "/first"))).body).toBe("first");
        expect((await router.route(req("GET", "/second"))).body).toBe("second");
    });
});
