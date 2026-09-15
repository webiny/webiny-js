import { describe, it, expect } from "vitest";
import type { Constructor } from "@webiny/di";
import { GetTaskDefinitionUseCaseImpl } from "~/api/features/GetTaskDefinition/GetTaskDefinitionUseCase.js";
import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
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

const useCaseOf = (
    definitions: TaskDefinition.Interface[],
    resolver: TaskHandlerResolver.Interface
) => {
    return new GetTaskDefinitionUseCaseImpl(definitions, resolver);
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

    it("fails when no definition matches the id", () => {
        const { resolver } = makeResolver();

        const result = useCaseOf([greet], resolver).execute("nope");

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("BackgroundTasks/TaskDefinition/NotFoundError");
    });

    it("takes the hooks from the handler", async () => {
        const calls: string[] = [];
        const { resolver } = makeResolver();

        class HookedHandlerImpl implements TaskHandler.Interface {
            async run() {
                return { status: "done" } as any;
            }
            async onDone() {
                calls.push("onDone");
            }
        }

        const HookedHandler = TaskHandler.createImplementation({
            implementation: HookedHandlerImpl,
            dependencies: []
        });

        const definition: TaskDefinition.Interface = {
            id: "hooked",
            title: "Hooked",
            handler: HookedHandler
        };

        const result = useCaseOf([definition], resolver).execute("hooked");
        await result.value.onDone!({} as any);

        expect(calls).toEqual(["onDone"]);
        expect(result.value.onAbort).toBeUndefined();
    });
});
