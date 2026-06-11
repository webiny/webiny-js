import { EventHandler } from "~/features/events/EventHandler.js";
import { EventType } from "~/features/events/EventType.js";
import { isHttpRequest } from "~/features/http/abstractions.js";
import type { IHttpRequest } from "~/features/http/abstractions.js";

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
