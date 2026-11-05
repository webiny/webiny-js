import { randomUUID } from "node:crypto";
import { Container } from "@webiny/di";
import { ChildContainerFactory, HandlerConfig } from "./abstractions.js";
import { RequestContainer } from "./RequestContainer.js";
import { RequestId } from "./RequestId.js";
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
        const child = root.createChildContainer();
        child.registerInstance(RequestContainer, child);

        /*
         * `HandlerApp.handle()` opens the execution's scope before calling this. Outside it (a test
         * building a container by hand), the container gets an execution of its own.
         */
        const frame = this.scope.getCurrent() ?? { executionId: randomUUID() };
        const handlerExecution = new DefaultHandlerExecution(frame, this.scope);
        child.registerInstance(HandlerExecution, handlerExecution);

        /*
         * A default so the abstraction always resolves. Registered before the transport binds, so a
         * transport with an id of its own can override it: the last instance registered wins.
         */
        child.registerInstance(RequestId, { value: frame.executionId });

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
