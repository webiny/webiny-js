import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { ChildContainerFactory } from "~/features/events/abstractions.js";
import { HandlerConfig } from "~/features/events/abstractions.js";
import { DefaultChildContainerFactory } from "~/features/events/ChildContainerFactory.js";
import { HandlerExecutionScope } from "~/features/events/HandlerExecutionScope.js";
import { DefaultHandlerExecutionScope } from "~/features/events/DefaultHandlerExecutionScope.js";
import { HandlerExecution } from "~/features/events/HandlerExecution.js";

const createAppContainer = () => {
    const appContainer = new Container();
    appContainer.registerInstance(HandlerConfig, { root: () => {} });
    appContainer.register(DefaultHandlerExecutionScope).inSingletonScope();
    appContainer.register(DefaultChildContainerFactory).inSingletonScope();
    return appContainer;
};

describe("ChildContainerFactory", () => {
    it("registers the current handler execution in the container it creates", async () => {
        const appContainer = createAppContainer();
        const factory = appContainer.resolve(ChildContainerFactory);
        const scope = appContainer.resolve(HandlerExecutionScope);
        const root = new Container();

        const executionId = await scope.run("execution-1", async () => {
            const child = await factory.create(root, [{}]);
            const handlerExecution = child.resolve(HandlerExecution);
            return handlerExecution.getId();
        });

        expect(executionId).toBe("execution-1");
    });

    it("refuses to create a container outside a handler execution", async () => {
        const appContainer = createAppContainer();
        const factory = appContainer.resolve(ChildContainerFactory);
        const root = new Container();

        await expect(factory.create(root, [{}])).rejects.toThrow(
            "ChildContainerFactory.create() was called outside a handler execution"
        );
    });
});
