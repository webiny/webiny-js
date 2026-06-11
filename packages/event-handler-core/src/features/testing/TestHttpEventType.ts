import { EventHandler } from "~/features/events/EventHandler.js";
import { EventType } from "~/features/events/EventType.js";
import { IHttpRequest } from "~/features/http";

export function isHttpRequest(event: any): event is IHttpRequest {
    return (
        typeof event === "object" &&
        event !== null &&
        typeof event.method === "string" &&
        typeof event.path === "string" &&
        typeof event.headers === "object" &&
        typeof event.query === "object"
    );
}

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
            return EventHandler;
        }
    },
    dependencies: []
});
