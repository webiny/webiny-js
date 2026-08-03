import { Abstraction, Container } from "@webiny/di";
import { HandlerConfig } from "./HandlerConfig.js";

/**
 * Builds the ROOT container once per process and reuses it across warm invocations. Decoratable —
 * wrap it to run process-lifetime setup around the root build.
 *
 * When {@link HandlerConfig.rootContainer} is supplied (the Node server builds the root eagerly at
 * startup), that container is returned as-is and `config.root` is NOT called again.
 */
export interface IRootContainerFactory {
    get(): Promise<Container>;
}

export const RootContainerFactory = new Abstraction<IRootContainerFactory>("RootContainerFactory");

export namespace RootContainerFactory {
    export type Interface = IRootContainerFactory;
}

class RootContainerFactoryImpl implements IRootContainerFactory {
    private rootContainer: Container | null;

    constructor(private config: HandlerConfig.Interface) {
        this.rootContainer = config.rootContainer ?? null;
    }

    async get(): Promise<Container> {
        if (!this.rootContainer) {
            this.rootContainer = new Container();
            await this.config.root(this.rootContainer);
        }
        return this.rootContainer;
    }
}

export const DefaultRootContainerFactory = RootContainerFactory.createImplementation({
    implementation: RootContainerFactoryImpl,
    dependencies: [HandlerConfig]
});
