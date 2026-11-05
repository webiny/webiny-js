import type { Container } from "@webiny/di";
import { EventType } from "./EventType.js";
import { executeChain } from "./chain.js";
import { NoMatchingEventTypeError } from "./NoMatchingEventTypeError.js";

/**
 * Finds the event type that can handle `event` and runs that type's handler chain, resolved from
 * the handler execution's container. Throws `NoMatchingEventTypeError` when no event type matches.
 */
export async function dispatchEvent(container: Container, event: unknown): Promise<unknown> {
    const eventTypes = container.resolveAll(EventType);
    const matched = eventTypes.find(eventType => eventType.canHandle(event));

    if (!matched) {
        throw new NoMatchingEventTypeError(event, eventTypes);
    }

    const abstraction = matched.getHandlerAbstraction();
    const handlers = container.resolveAll(abstraction);

    return executeChain(handlers, event);
}
