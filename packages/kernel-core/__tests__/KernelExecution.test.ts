import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { InputHandler } from "~/features/kernel/InputHandler.js";
import { InputType } from "~/features/kernel/InputType.js";
import { Kernel } from "~/features/kernel/Kernel.js";
import { KernelExecution } from "~/features/kernel/KernelExecution.js";
import { StaleKernelExecutionError } from "~/features/kernel/StaleKernelExecutionError.js";
import { KernelPlatform } from "~/features/kernel/KernelPlatform.js";

// A platform whose invocation id is the second raw argument's `requestId`, like Lambda's context.
class SecondArgumentIdPlatform implements KernelPlatform.Interface {
    bind() {}

    getExecutionId(rawArgs: any[]): string | undefined {
        const context: { requestId: string } | undefined = rawArgs[1];
        return context?.requestId;
    }
}

const secondArgumentIdPlatform = KernelPlatform.createImplementation({
    implementation: SecondArgumentIdPlatform,
    dependencies: []
});

// A platform that gives every invocation the same id, as Lambda does when it retries one.
class RetryingPlatform implements KernelPlatform.Interface {
    bind() {}

    getExecutionId(): string {
        return "retried-request";
    }
}

const retryingPlatform = KernelPlatform.createImplementation({
    implementation: RetryingPlatform,
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

describe("KernelExecution", () => {
    class ReadExecutionHandler implements InputHandler.Interface {
        constructor(private kernelExecution: KernelExecution.Interface) {}

        async execute() {
            this.kernelExecution.assertCurrent("Test");
            return this.kernelExecution.getId();
        }
    }

    const readExecutionHandler = InputHandler.createImplementation({
        implementation: ReadExecutionHandler,
        dependencies: [KernelExecution]
    });

    it("passes inside its own execution, with a generated id per execution", async () => {
        const app = Kernel.init({
            root: container => {
                container.register(anyInputType);
                container.register(readExecutionHandler);
            }
        });

        const first = await app.handle({});
        const second = await app.handle({});
        expect(first).toMatch(/^[0-9a-f-]{36}$/);
        expect(second).not.toBe(first);
    });

    it("takes its id from the platform when the platform has one", async () => {
        const app = Kernel.init({
            platform: secondArgumentIdPlatform,
            root: container => {
                container.register(anyInputType);
                container.register(readExecutionHandler);
            }
        });

        const fromPlatform = await app.handle({}, { requestId: "platform-request" });
        const generated = await app.handle({});
        expect(fromPlatform).toBe("platform-request");
        expect(generated).toMatch(/^[0-9a-f-]{36}$/);
    });

    it("tells two executions apart even when the platform gives them the same id", async () => {
        const kept: KernelExecution.Interface[] = [];

        class KeepFirstExecutionHandler implements InputHandler.Interface {
            constructor(private kernelExecution: KernelExecution.Interface) {}

            async execute() {
                kept.push(this.kernelExecution);
                kept[0].assertCurrent("Test");
                return kept[0].getId();
            }
        }

        const keepFirstExecutionHandler = InputHandler.createImplementation({
            implementation: KeepFirstExecutionHandler,
            dependencies: [KernelExecution]
        });

        const app = Kernel.init({
            platform: retryingPlatform,
            root: container => {
                container.register(anyInputType);
                container.register(keepFirstExecutionHandler);
            }
        });

        expect(await app.handle({})).toBe("retried-request");
        await expect(app.handle({})).rejects.toThrow(
            'belongs to kernel execution "retried-request" but was used during a later kernel execution with the same id'
        );
    });

    it("checks container setup too", async () => {
        const kept: KernelExecution.Interface[] = [];

        const app = Kernel.init({
            root: container => {
                container.register(anyInputType);
                container.register(readExecutionHandler);
            },
            child: container => {
                const kernelExecution = container.resolve(KernelExecution);
                kept.push(kernelExecution);
                kept[0].assertCurrent("Setup");
            }
        });

        await app.handle({});
        await expect(app.handle({})).rejects.toThrow(StaleKernelExecutionError);
    });

    it("throws when a later kernel execution uses an earlier one's instance", async () => {
        const kept: KernelExecution.Interface[] = [];

        class KeepExecutionHandler implements InputHandler.Interface {
            constructor(private kernelExecution: KernelExecution.Interface) {}

            async execute() {
                kept.push(this.kernelExecution);
                kept[0].assertCurrent("Test");
                return "ok";
            }
        }

        const keepExecutionHandler = InputHandler.createImplementation({
            implementation: KeepExecutionHandler,
            dependencies: [KernelExecution]
        });

        const app = Kernel.init({
            root: container => {
                container.register(anyInputType);
                container.register(keepExecutionHandler);
            }
        });

        expect(await app.handle({})).toBe("ok");
        await expect(app.handle({})).rejects.toThrow(StaleKernelExecutionError);
    });
});
