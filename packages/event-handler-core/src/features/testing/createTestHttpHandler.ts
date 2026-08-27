import { HttpFeature } from "~/features/http/feature.js";
import { HttpRouterHandler } from "./HttpRouterHandler.js";
import { HandlerApp } from "~/features/events/HandlerApp.js";
import { TestHttpEventType } from "./TestHttpEventType.js";
import type { HandlerSetup, IHttpRequest, IHttpResponse } from "~/index.js";

export interface createTestHttpHandlerOptions {
    root: HandlerSetup;
    child?: HandlerSetup;
}

/**
 * Test handler that accepts IHttpRequest directly and returns IHttpResponse.
 * Registers HttpRouterHandler as the base TestHttpEventHandler implementation.
 * Callers layer middleware on top via container.registerDecorator() in options.root.
 */
export function createTestHttpHandler(options: createTestHttpHandlerOptions) {
    const app = HandlerApp.init({
        root: async container => {
            container.register(TestHttpEventType);
            container.register(HttpRouterHandler);
            HttpFeature.register(container);
            await options.root(container);
        },
        child: options.child
    });

    return async (
        request: Partial<IHttpRequest> & { method: string; path: string }
    ): Promise<IHttpResponse> => {
        return app.handle({
            method: request.method,
            path: request.path,
            headers: request.headers ?? {},
            query: request.query ?? {},
            pathParameters: request.pathParameters ?? {},
            body: request.body
        });
    };
}
