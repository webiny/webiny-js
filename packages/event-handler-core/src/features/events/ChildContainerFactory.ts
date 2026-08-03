import { Abstraction, Container } from "@webiny/di";
import { HandlerConfig } from "./HandlerConfig.js";
import { RequestContainer } from "./RequestContainer.js";
import { RequestInitializer } from "./RequestInitializer.js";

/**
 * Creates and sets up the per-request (child) container: spawns the child, binds transport
 * primitives, runs request setup, and runs the pre-dispatch {@link RequestInitializer} loop.
 *
 * Decoratable — this is the seam for per-request work that must run BEFORE the register/dispatch
 * flow (e.g. refreshing a project-level license so register-time checks see it). Since such work
 * typically needs only root-scoped state, a decorator can act before delegating to `create()`.
 */
export interface IChildContainerFactory {
    create(root: Container, rawArgs: any[]): Promise<Container>;
}

export const ChildContainerFactory = new Abstraction<IChildContainerFactory>(
    "ChildContainerFactory"
);

export namespace ChildContainerFactory {
    export type Interface = IChildContainerFactory;
}

class ChildContainerFactoryImpl implements IChildContainerFactory {
    constructor(private config: HandlerConfig.Interface) {}

    async create(root: Container, rawArgs: any[]): Promise<Container> {
        const child = root.createChildContainer();
        child.registerInstance(RequestContainer, child);

        // Transport-specific bind: register the raw platform arguments into the request container
        // before request setup runs. The default transport binds nothing.
        await this.config.transport.bind(child, ...rawArgs);

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
