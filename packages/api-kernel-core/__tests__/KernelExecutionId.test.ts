import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { InputHandler } from "~/features/kernel/InputHandler.js";
import type { InputContext } from "~/features/kernel/InputHandler.js";
import { InputType } from "~/features/kernel/InputType.js";
import { Kernel } from "~/features/kernel/Kernel.js";
import { KernelExecutionId } from "~/features/kernel/KernelExecutionId.js";
import { KernelPlatform } from "~/features/kernel/KernelPlatform.js";

// A platform whose invocation id is the event's `id`.
class EventIdPlatform implements KernelPlatform.Interface {
    bind() {}

    getExecutionId(rawArgs: any[]): string | undefined {
        return rawArgs[0].id;
    }
}

const eventIdPlatform = KernelPlatform.createImplementation({
    implementation: EventIdPlatform,
    dependencies: []
});

class AnyInputType implements InputType.Interface {
    matches(_input: any): _input is any {
        return true;
    }
    getHandlerAbstraction() {
        return InputHandler;
    }
}

const anyInputType = InputType.createImplementation({
    implementation: AnyInputType,
    dependencies: []
});

interface ITestEvent {
    id: string;
    // Resolves when the execution may read its id again.
    resume: Promise<void>;
}

/*
 * Reads the current id through a service registered in the ROOT container (as the logger does),
 * before and after waiting, so another execution can run in between.
 */
class ReadIdsHandler implements InputHandler.Interface<ITestEvent> {
    constructor(private executionId: KernelExecutionId.Interface) {}

    async execute(ctx: InputContext<ITestEvent>) {
        const before = this.executionId.getId();
        await ctx.input.resume;
        const after = this.executionId.getId();
        return [before, after];
    }
}

const readIdsHandler = InputHandler.createImplementation({
    implementation: ReadIdsHandler,
    dependencies: [KernelExecutionId]
});

const createApp = () => {
    return Kernel.init({
        platform: eventIdPlatform,
        root: container => {
            container.register(anyInputType);
            container.register(readIdsHandler);
        }
    });
};

describe("KernelExecutionId", () => {
    it("gives each of two interleaved executions its own id", async () => {
        const app = createApp();
        let resumeFirst = () => {};
        const firstResume = new Promise<void>(resolve => {
            resumeFirst = resolve;
        });

        // The first execution waits; the second runs to the end in the meantime.
        const first = app.handle({ id: "first", resume: firstResume });
        const secondResume = Promise.resolve();
        const second = await app.handle({ id: "second", resume: secondResume });
        resumeFirst();

        expect(await first).toEqual(["first", "first"]);
        expect(second).toEqual(["second", "second"]);
    });

    it("has no id outside an execution", async () => {
        const app = createApp();
        const root = await app.getRootContainer();

        const executionId = root.resolve(KernelExecutionId);

        expect(executionId.getId()).toBeUndefined();
    });
});
