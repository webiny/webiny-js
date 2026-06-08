import type { EventBridgeEvent } from "@webiny/aws-sdk/types/index.js";
import { EventType } from "@webiny/event-handler";
import { EventBridgeEventHandler } from "../abstractions/functions/EventBridgeEventHandler.js";
import type { IEventType } from "@webiny/event-handler";

class EventBridgeEventTypeImpl implements IEventType<EventBridgeEvent<string, any>> {
    canHandle(event: any): event is EventBridgeEvent<string, any> {
        return !!(event?.source && event?.["detail-type"] && event?.detail);
    }

    getHandlerAbstraction() {
        return EventBridgeEventHandler;
    }
}

export const EventBridgeEventType = EventType.createImplementation({
    implementation: EventBridgeEventTypeImpl,
    dependencies: []
});
