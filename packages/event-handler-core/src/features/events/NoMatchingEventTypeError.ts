import type { EventType } from "./EventType.js";
import { EventShape } from "./EventShape.js";

/*
 * Name each registered type by the handler abstraction it dispatches to, NOT by `constructor.name`:
 * the production bundle minifies class names, so every entry came back as "implementation", useless
 * in exactly the place this message matters. An abstraction's name is a string literal, so it
 * survives bundling.
 */
function nameEventTypes(eventTypes: EventType.Interface[]): string[] {
    return eventTypes.map(eventType => {
        try {
            const abstraction = eventType.getHandlerAbstraction();
            return String(abstraction);
        } catch {
            return "<unknown>";
        }
    });
}

/**
 * No registered event type can handle the incoming event. The message gives the event's shape and
 * the registered event types, so a misrouted invocation can be debugged from the log alone.
 */
export class NoMatchingEventTypeError extends Error {
    constructor(event: unknown, eventTypes: EventType.Interface[]) {
        const shape = EventShape.from(event);
        const registered = nameEventTypes(eventTypes);
        const registeredList = JSON.stringify(registered);
        const message = `No event type matched the incoming event. Event shape: ${shape}; registered event types: ${registeredList}`;

        super(message);
        this.name = "NoMatchingEventTypeError";
    }
}
