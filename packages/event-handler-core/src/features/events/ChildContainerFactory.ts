import { randomUUID } from "node:crypto";
import { Container } from "@webiny/di";
import { ChildContainerFactory, HandlerConfig } from "./abstractions.js";
import { RequestContainer } from "./RequestContainer.js";
import { RequestId } from "./RequestId.js";
import { noopTransport } from "./Transport.js";

class ChildContainerFactoryImpl implements ChildContainerFactory.Interface {
    constructor(private config: HandlerConfig.Interface) {}

    async create(root: Container, rawArgs: any[]): Promise<Container> {
        const child = root.createChildContainer();
        child.registerInstance(RequestContainer, child);
        /*
         * A default so the abstraction always resolves. Registered before the transport binds, so a
         * transport with an id of its own can override it: the last instance registered wins.
         */
        child.registerInstance(RequestId, { value: randomUUID() });

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
    dependencies: [HandlerConfig]
});
