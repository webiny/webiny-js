import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { ChildContainerFactory } from "~/features/kernel/abstractions.js";
import { KernelConfig } from "~/features/kernel/abstractions.js";
import { DefaultChildContainerFactory } from "~/features/kernel/ChildContainerFactory.js";
import { KernelExecutionScope } from "~/features/kernel/KernelExecutionScope.js";
import { DefaultKernelExecutionScope } from "~/features/kernel/DefaultKernelExecutionScope.js";
import { KernelExecution } from "~/features/kernel/KernelExecution.js";
import { NoopKernelPlatform } from "~/features/kernel/NoopKernelPlatform.js";

const createAppContainer = () => {
    const appContainer = new Container();
    appContainer.registerInstance(KernelConfig, { root: () => {} });
    appContainer.register(DefaultKernelExecutionScope).inSingletonScope();
    appContainer.register(DefaultChildContainerFactory).inSingletonScope();
    appContainer.register(NoopKernelPlatform).inSingletonScope();
    return appContainer;
};

describe("ChildContainerFactory", () => {
    it("registers the current kernel execution in the container it creates", async () => {
        const appContainer = createAppContainer();
        const factory = appContainer.resolve(ChildContainerFactory);
        const scope = appContainer.resolve(KernelExecutionScope);
        const root = new Container();

        const executionId = await scope.run("execution-1", async () => {
            const child = await factory.create(root, [{}]);
            const kernelExecution = child.resolve(KernelExecution);
            return kernelExecution.getId();
        });

        expect(executionId).toBe("execution-1");
    });

    it("refuses to create a container outside a kernel execution", async () => {
        const appContainer = createAppContainer();
        const factory = appContainer.resolve(ChildContainerFactory);
        const root = new Container();

        await expect(factory.create(root, [{}])).rejects.toThrow(
            "ChildContainerFactory.create() was called outside a kernel execution"
        );
    });
});
