import { Container } from "@webiny/di";
import { ChildContainerFactory, HandlerConfig } from "./abstractions.js";
import { RequestContainer } from "./RequestContainer.js";
import { RequestInitializer } from "./RequestInitializer.js";
import { noopTransport } from "./Transport.js";

class ChildContainerFactoryImpl implements ChildContainerFactory.Interface {
    constructor(private config: HandlerConfig.Interface) {}

    async create(root: Container, rawArgs: any[]): Promise<Container> {
        const child = root.createChildContainer();
        child.registerInstance(RequestContainer, child);

        // Transport-specific bind: register the raw platform arguments into the request container
        // before request setup runs. The default transport binds nothing.
        const transport = this.config.transport ?? noopTransport;
        await transport.bind(child, ...rawArgs);

        if (this.config.request) {
            await this.config.request(child);
        }

        // Per-request async initialization (tenant-agnostic), before the event is dispatched and
        // before auth/tenant are established. For tenant-dependent setup use lazy DI factories.
        for (const initializer of child.resolveAll(RequestInitializer)) {
            await initializer.init();
        }

        return child;
    }
}

export const DefaultChildContainerFactory = ChildContainerFactory.createImplementation({
    implementation: ChildContainerFactoryImpl,
    dependencies: [HandlerConfig]
});
