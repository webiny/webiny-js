import { Container } from "@webiny/di";
import { HandlerConfig, RootContainerFactory } from "./abstractions.js";

class RootContainerFactoryImpl implements RootContainerFactory.Interface {
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
