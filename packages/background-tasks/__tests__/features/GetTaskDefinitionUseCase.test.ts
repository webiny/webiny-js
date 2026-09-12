import { describe, it, expect } from "vitest";
import type { Constructor } from "@webiny/di";
import { GetTaskDefinitionUseCaseImpl } from "~/api/features/GetTaskDefinition/GetTaskDefinitionUseCase.js";
import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { Logger } from "@webiny/api-core/features/logger/index.js";
import type { TaskHandlerResolver } from "~/api/features/TaskHandlerResolver/index.js";

/**
 * Records which handler classes were actually built, so a test can assert that looking up one task
 * does not construct the others.
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

const makeLogger = () => {
    const errors: unknown[] = [];
    const logger = {
        error: (...args: unknown[]) => {
            errors.push(args);
        },
        warn: () => undefined,
        info: () => undefined,
        debug: () => undefined
    } as unknown as Logger.Interface;
    return { logger, errors };
};

const useCaseOf = (
    definitions: TaskDefinition.Interface[],
    resolver: TaskHandlerResolver.Interface,
    logger: Logger.Interface = makeLogger().logger
) => {
    return new GetTaskDefinitionUseCaseImpl(definitions, resolver, logger);
};

/**
 * Handlers go through `createImplementation` because that is what production requires:
 * `resolveImplementation` reads dependency metadata off the class and throws
 * "No abstraction metadata found" for a plain one.
 */
class GreetHandlerImpl implements TaskHandler.Interface {
    async run() {
        return { status: "done", output: { greeted: true } } as any;
    }
}

const GreetHandler = TaskHandler.createImplementation({
    implementation: GreetHandlerImpl,
    dependencies: []
});

class NeverBuiltHandlerImpl implements TaskHandler.Interface {
    async run() {
        return { status: "done" } as any;
    }
}

const NeverBuiltHandler = TaskHandler.createImplementation({
    implementation: NeverBuiltHandlerImpl,
    dependencies: []
});

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
        expect(resolved).toEqual(["GreetHandlerImpl"]);
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

    describe("hook chaining", () => {
        // A definition-level hook is what a decorator contributes — SelfCleaningTaskDecorator's
        // onDone is exactly this. Dropping either half would break decoration or the task itself.
        const makeChained = (onHandlerDone: () => void, onDefinitionDone: () => void) => {
            class ChainedHandlerImpl implements TaskHandler.Interface {
                async run() {
                    return { status: "done" } as any;
                }
                async onDone() {
                    onHandlerDone();
                }
            }

            const ChainedHandler = TaskHandler.createImplementation({
                implementation: ChainedHandlerImpl,
                dependencies: []
            });

            return {
                id: "chained",
                title: "Chained",
                handler: ChainedHandler,
                onDone: async () => {
                    onDefinitionDone();
                }
            } as TaskDefinition.Interface;
        };

        it("runs the handler's hook before the decorator's", async () => {
            const calls: string[] = [];
            const { resolver } = makeResolver();
            const definition = makeChained(
                () => calls.push("handler"),
                () => calls.push("decorator")
            );

            const result = useCaseOf([definition], resolver).execute("chained");
            await result.value.onDone!({} as any);

            expect(calls).toEqual(["handler", "decorator"]);
        });

        it("still runs the decorator's hook when the handler's throws", async () => {
            const calls: string[] = [];
            const { resolver } = makeResolver();
            const { logger, errors } = makeLogger();
            const definition = makeChained(
                () => {
                    throw new Error("boom");
                },
                () => calls.push("decorator")
            );

            const result = useCaseOf([definition], resolver, logger).execute("chained");
            await result.value.onDone!({} as any);

            expect(calls).toEqual(["decorator"]);
            expect(errors).toHaveLength(1);
        });

        it("leaves a hook undefined when neither half defines it", () => {
            const { resolver } = makeResolver();

            const result = useCaseOf([greet], resolver).execute("greet");

            expect(result.value.onAbort).toBeUndefined();
        });
    });
});
