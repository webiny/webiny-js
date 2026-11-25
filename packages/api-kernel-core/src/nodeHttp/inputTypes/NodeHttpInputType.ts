import { IncomingMessage } from "node:http";
import { InputType } from "~/index.js";

import { NodeHttpInputHandler } from "~/nodeHttp/abstractions/NodeHttpInputHandler.js";

class NodeHttpInputTypeImpl implements InputType.Interface<IncomingMessage> {
    matches(input: any): input is IncomingMessage {
        return input instanceof IncomingMessage;
    }

    getHandlerAbstraction() {
        return NodeHttpInputHandler;
    }
}

export const NodeHttpInputType = InputType.createImplementation({
    implementation: NodeHttpInputTypeImpl,
    dependencies: []
});
