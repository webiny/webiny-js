import { IncomingMessage } from "node:http";
import { EventType } from "~/index.js";
import type { IEventType } from "~/index.js";
import { NodeHttpEventHandler } from "~/nodeHttp/abstractions/NodeHttpEventHandler.js";

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
