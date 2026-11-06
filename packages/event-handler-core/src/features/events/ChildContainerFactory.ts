import { Container } from "@webiny/di";
import { ChildContainerFactory, HandlerConfig } from "./abstractions.js";
import { RequestContainer } from "./RequestContainer.js";
import { HandlerExecution } from "./HandlerExecution.js";
import { DefaultHandlerExecution } from "./DefaultHandlerExecution.js";
import { HandlerExecutionScope } from "./HandlerExecutionScope.js";
import { noopTransport } from "./Transport.js";

class ChildContainerFactoryImpl implements ChildContainerFactory.Interface {
    constructor(
        private config: HandlerConfig.Interface,
        private scope: HandlerExecutionScope.Interface
    ) {}

    async create(root: Container, rawArgs: any[]): Promise<Container> {
        // `HandlerExecutionRunner` opens the execution's scope before calling this.
        const frame = this.scope.getCurrent();
        if (!frame) {
            throw new Error(
                "ChildContainerFactory.create() was called outside a handler execution. Call it through HandlerExecutionRunner, which opens the execution's scope first."
            );
        }

        const child = root.createChildContainer();
        child.registerInstance(RequestContainer, child);

        const handlerExecution = new DefaultHandlerExecution(frame, this.scope);
        child.registerInstance(HandlerExecution, handlerExecution);

        // Transport-specific bind: register the raw platform arguments into the request container
        // before request setup runs. The default transport binds nothing.
        const transport = this.config.transport ?? noopTransport;
        await transport.bind(child, ...rawArgs);

        if (this.config.child) {
            await this.config.child(child);
        }

        return child;
    }
}

export const DefaultChildContainerFactory = ChildContainerFactory.createImplementation({
    implementation: ChildContainerFactoryImpl,
    dependencies: [HandlerConfig, HandlerExecutionScope]
});
