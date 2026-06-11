import { HttpFeature } from "~/features/http/feature.js";
import { createHandler } from "~/features/events/createHandler.js";
import { TestEventType } from "./TestEventType.js";
import type { HandlerSetup, IHttpRequest, IHttpResponse } from "~/index.js";

export interface createTestHandlerOptions {
    root: HandlerSetup;
    request?: HandlerSetup;
}

/**
 * Test handler that accepts IHttpRequest directly and returns IHttpResponse.
 * Registers TestEventType automatically — no AWS/Node transport needed.
 */
export function createTestHandler(options: createTestHandlerOptions) {
    const invoke = createHandler({
        root: async container => {
            container.register(TestEventType);
            HttpFeature.register(container);
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
