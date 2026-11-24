import { Container } from "@webiny/di";
import { ChildContainerFactory, KernelConfig } from "./abstractions.js";
import { RequestContainer } from "./RequestContainer.js";
import { KernelExecution } from "./KernelExecution.js";
import { DefaultKernelExecution } from "./DefaultKernelExecution.js";
import { KernelExecutionScope } from "./KernelExecutionScope.js";
import { KernelPlatform } from "./KernelPlatform.js";

class ChildContainerFactoryImpl implements ChildContainerFactory.Interface {
    constructor(
        private config: KernelConfig.Interface,
        private scope: KernelExecutionScope.Interface,
        private platform: KernelPlatform.Interface
    ) {}

    async create(root: Container, rawArgs: any[]): Promise<Container> {
        // `KernelExecutionRunner` opens the execution's scope before calling this.
        const frame = this.scope.getCurrent();
        if (!frame) {
            throw new Error(
                "ChildContainerFactory.create() was called outside a kernel execution. Call it through KernelExecutionRunner, which opens the execution's scope first."
            );
        }

        const child = root.createChildContainer();
        child.registerInstance(RequestContainer, child);

        const kernelExecution = new DefaultKernelExecution(frame, this.scope);
        child.registerInstance(KernelExecution, kernelExecution);

        // Register the raw platform arguments into the container before request setup runs.
        await this.platform.bind(child, rawArgs);

        if (this.config.child) {
            await this.config.child(child);
        }

        return child;
    }
}

export const DefaultChildContainerFactory = ChildContainerFactory.createImplementation({
    implementation: ChildContainerFactoryImpl,
    dependencies: [KernelConfig, KernelExecutionScope, KernelPlatform]
});
