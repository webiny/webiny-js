import { HttpEventHandler } from "~/features/events/EventHandler.js";
import { EventType } from "~/features/events/EventType.js";
import { isHttpRequest } from "~/features/http/abstractions.js";
import { createHandler } from "~/features/events/createHandler.js";
import type { HandlerSetup, IHttpRequest, IHttpResponse } from "~/index.js";

/**
 * EventType that recognizes IHttpRequest directly — no transport translation needed.
 * Use in tests to feed IHttpRequest straight into the chain, bypassing AWS/Node adapters.
 */
export const TestHttpEventType = EventType.createImplementation({
    implementation: class {
        canHandle(event: any): event is IHttpRequest {
            return isHttpRequest(event);
        }

        getHandlerAbstraction() {
            return HttpEventHandler;
        }
    },
    dependencies: []
});

export interface CreateTestHttpHandlerOptions {
    root: HandlerSetup;
    request?: HandlerSetup;
}

/**
 * Test handler that accepts IHttpRequest directly and returns IHttpResponse.
 * Registers TestHttpEventType automatically — no AWS/Node transport needed.
 */
export function createTestHttpHandler(options: CreateTestHttpHandlerOptions) {
    const invoke = createHandler({
        root: async container => {
            container.register(TestHttpEventType);
            await options.root(container);
        },
        request: options.request
    });

    return async (
        request: Partial<IHttpRequest> & { method: string; path: string }
    ): Promise<IHttpResponse> => {
        return invoke({
            method: request.method,
            path: request.path,
            headers: request.headers ?? {},
            query: request.query ?? {},
            pathParameters: request.pathParameters ?? {},
            body: request.body
        });
    };
}
