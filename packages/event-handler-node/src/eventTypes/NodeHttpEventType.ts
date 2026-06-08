import { IncomingMessage } from "node:http";
import { EventType, HttpEventHandler } from "@webiny/event-handler";
import type { IEventType } from "@webiny/event-handler";

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
