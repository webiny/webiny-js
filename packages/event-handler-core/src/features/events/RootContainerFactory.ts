import { Container } from "@webiny/di";
import { HandlerConfig, RootContainerFactory } from "./abstractions.js";
import { HandlerExecutionId } from "./HandlerExecutionId.js";
import { DefaultHandlerExecutionId } from "./DefaultHandlerExecutionId.js";
import { HandlerExecutionScope } from "./HandlerExecutionScope.js";

class RootContainerFactoryImpl implements RootContainerFactory.Interface {
    private rootContainer: Container | null = null;

    constructor(
        private config: HandlerConfig.Interface,
        private scope: HandlerExecutionScope.Interface
    ) {}

    async get(): Promise<Container> {
        if (!this.rootContainer) {
            this.rootContainer = new Container();

            // Registered first, so everything `root` registers can depend on it.
            const executionId = new DefaultHandlerExecutionId(this.scope);
            this.rootContainer.registerInstance(HandlerExecutionId, executionId);

            await this.config.root(this.rootContainer);
        }
        return this.rootContainer;
    }
}

export const DefaultRootContainerFactory = RootContainerFactory.createImplementation({
    implementation: RootContainerFactoryImpl,
    dependencies: [HandlerConfig, HandlerExecutionScope]
});
