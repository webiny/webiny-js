import { describe, it, expect } from "vitest";
import type { Constructor } from "@webiny/di";
import { GetTaskDefinitionUseCaseImpl } from "~/api/features/GetTaskDefinition/GetTaskDefinitionUseCase.js";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { TaskHandlerResolver } from "~/api/features/TaskHandlerResolver/index.js";

/**
 * Records which handler classes were actually built, so a test can assert that looking up one task
 * does not construct the other 28.
 */
const makeResolver = () => {
    const resolved: string[] = [];
    const resolver: TaskHandlerResolver.Interface = {
        resolve: (handler: Constructor<any>) => {
            resolved.push(handler.name);
            return new handler();
        }
    };
    return { resolver, resolved };
};

const useCaseOf = (
    definitions: TaskDefinition.Interface[],
    resolver: TaskHandlerResolver.Interface
) => {
    return new GetTaskDefinitionUseCaseImpl(definitions, resolver);
};

class GreetHandler implements TaskDefinition.Handler {
    async run() {
        return { status: "done", output: { greeted: true } } as any;
    }
}

class NeverBuiltHandler implements TaskDefinition.Handler {
    async run() {
        return { status: "done" } as any;
    }
}

const greet: TaskDefinition.Interface = {
    id: "greet",
    title: "Greet",
    handler: GreetHandler
};

const other: TaskDefinition.Interface = {
    id: "other",
    title: "Other",
    handler: NeverBuiltHandler
};

describe("GetTaskDefinitionUseCase", () => {
    it("builds only the handler of the task being looked up", () => {
        const { resolver, resolved } = makeResolver();

        const result = useCaseOf([greet, other], resolver).execute("greet");

        expect(result.isOk()).toBe(true);
        expect(resolved).toEqual(["GreetHandler"]);
    });

    it("exposes metadata from the definition and behaviour from the handler", async () => {
        const { resolver } = makeResolver();

        const result = useCaseOf([greet], resolver).execute("greet");
        const runnable = result.value;

        expect(runnable.id).toBe("greet");
        expect(runnable.title).toBe("Greet");
        await expect(runnable.run({} as any)).resolves.toEqual({
            status: "done",
            output: { greeted: true }
        });
    });

    it("still accepts a definition that carries run() itself", async () => {
        const { resolver, resolved } = makeResolver();
        const legacy: TaskDefinition.Interface = {
            id: "legacy",
            title: "Legacy",
            run: async () => ({ status: "done", output: { legacy: true } }) as any
        };

        const result = useCaseOf([legacy], resolver).execute("legacy");

        expect(result.isOk()).toBe(true);
        expect(resolved).toEqual([]);
        await expect(result.value.run({} as any)).resolves.toEqual({
            status: "done",
            output: { legacy: true }
        });
    });

    it("fails when a definition supplies neither a handler nor run()", () => {
        const { resolver } = makeResolver();
        const broken = { id: "broken", title: "Broken" } as TaskDefinition.Interface;

        const result = useCaseOf([broken], resolver).execute("broken");

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("BackgroundTasks/TaskDefinition/NotRunnableError");
    });

    it("fails when no definition matches the id", () => {
        const { resolver } = makeResolver();

        const result = useCaseOf([greet], resolver).execute("nope");

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("BackgroundTasks/TaskDefinition/NotFoundError");
    });
});
