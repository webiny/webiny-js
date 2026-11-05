import { Container } from "@webiny/di";
import { ChildContainerFactory, HandlerConfig } from "./abstractions.js";
import { RequestContainer } from "./RequestContainer.js";
import { HandlerExecution } from "./HandlerExecution.js";
import { DefaultHandlerExecution } from "./DefaultHandlerExecution.js";
import { HandlerExecutionScope } from "./HandlerExecutionScope.js";
import { noopTransport } from "./Transport.js";
import { createExecutionId } from "./createExecutionId.js";

class ChildContainerFactoryImpl implements ChildContainerFactory.Interface {
    constructor(
        private config: HandlerConfig.Interface,
        private scope: HandlerExecutionScope.Interface
    ) {}

    private createFrame(rawArgs: any[]): HandlerExecutionScope.Frame {
        const platformId = this.config.transport?.getExecutionId?.(...rawArgs);
        const executionId = createExecutionId(platformId);
        return { executionId };
    }

    async create(root: Container, rawArgs: any[]): Promise<Container> {
        const child = root.createChildContainer();
        child.registerInstance(RequestContainer, child);

        /*
         * The handler execution runner opens the execution's scope before calling this. Outside it
         * (a test building a container by hand), the container gets an execution of its own, with
         * its id made the same way the runner makes one.
         */
        const frame = this.scope.getCurrent() ?? this.createFrame(rawArgs);
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
