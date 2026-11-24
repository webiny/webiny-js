import { Container } from "@webiny/di";
import { KernelConfig, RootContainerFactory } from "./abstractions.js";
import { KernelExecutionId } from "./KernelExecutionId.js";
import { DefaultKernelExecutionId } from "./DefaultKernelExecutionId.js";
import { KernelExecutionScope } from "./KernelExecutionScope.js";
import { DefaultInputChainRunner } from "./DefaultInputChainRunner.js";

class RootContainerFactoryImpl implements RootContainerFactory.Interface {
    private rootContainer: Container | null = null;

    constructor(
        private config: KernelConfig.Interface,
        private scope: KernelExecutionScope.Interface
    ) {}

    async get(): Promise<Container> {
        if (!this.rootContainer) {
            this.rootContainer = new Container();

            // Registered first, so everything `root` registers can depend on it.
            const executionId = new DefaultKernelExecutionId(this.scope);
            this.rootContainer.registerInstance(KernelExecutionId, executionId);
            // Registered before `root` runs, so `root` can decorate it.
            this.rootContainer.register(DefaultInputChainRunner);

            await this.config.root(this.rootContainer);
        }
        return this.rootContainer;
    }
}

export const DefaultRootContainerFactory = RootContainerFactory.createImplementation({
    implementation: RootContainerFactoryImpl,
    dependencies: [KernelConfig, KernelExecutionScope]
});
