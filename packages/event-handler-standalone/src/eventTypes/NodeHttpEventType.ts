import { IncomingMessage } from "node:http";
import { EventType } from "@webiny/event-handler-core";
import type { IEventType } from "@webiny/event-handler-core";
import { NodeHttpEventHandler } from "~/abstractions/NodeHttpEventHandler.js";

class NodeHttpEventTypeImpl implements IEventType<IncomingMessage> {
    canHandle(event: any): event is IncomingMessage {
        return event instanceof IncomingMessage;
    }

    getHandlerAbstraction() {
        return NodeHttpEventHandler;
    }
}

export const NodeHttpEventType = EventType.createImplementation({
    implementation: NodeHttpEventTypeImpl,
    dependencies: []
});
