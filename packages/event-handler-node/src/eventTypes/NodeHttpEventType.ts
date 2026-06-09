import { IncomingMessage } from "node:http";
import { EventType, HttpEventHandler } from "@webiny/event-handler-core";
import type { IEventType } from "@webiny/event-handler-core";

class NodeHttpEventTypeImpl implements IEventType<IncomingMessage> {
    canHandle(event: any): event is IncomingMessage {
        return event instanceof IncomingMessage;
    }

    getHandlerAbstraction() {
        return HttpEventHandler;
    }
}

export const NodeHttpEventType = EventType.createImplementation({
    implementation: NodeHttpEventTypeImpl,
    dependencies: []
});
