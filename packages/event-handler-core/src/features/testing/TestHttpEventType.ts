import { EventHandler } from "~/features/events/EventHandler.js";
import { EventType } from "~/features/events/EventType.js";

/**
 * EventType that recognizes IHttpRequest directly — no transport translation needed.
 * Use in tests to feed IHttpRequest straight into the chain, bypassing AWS/Node adapters.
 */
export const TestEventType = EventType.createImplementation({
    implementation: class {
        canHandle(_event: any): _event is any {
            return true;
        }

        getHandlerAbstraction() {
            return EventHandler;
        }
    },
    dependencies: []
});
