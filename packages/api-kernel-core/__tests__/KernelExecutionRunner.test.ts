import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { InputHandler } from "~/features/kernel/InputHandler.js";
import { InputType } from "~/features/kernel/InputType.js";
import { Kernel } from "~/features/kernel/Kernel.js";
import { KernelExecutionRunner } from "~/features/kernel/abstractions.js";
import { RootContainerFactory } from "~/features/kernel/abstractions.js";
import { KernelExecutionScope } from "~/features/kernel/KernelExecutionScope.js";

class AnyInputType implements InputType.Interface {
    matches(_input: any): _input is any {
        return true;
    }
    getHandlerAbstraction() {
        return InputHandler;
    }
}

class OkHandler implements InputHandler.Interface {
    async execute() {
        return "ok";
    }
}

const anyInputType = InputType.createImplementation({
    implementation: AnyInputType,
    dependencies: []
});

const okHandler = InputHandler.createImplementation({
    implementation: OkHandler,
    dependencies: []
});

describe("KernelExecutionRunner", () => {
    it("builds the root container outside any execution's scope", async () => {
        const executionsSeenByRoot: (string | undefined)[] = [];

        class ObservingRootContainerFactory implements RootContainerFactory.Interface {
            constructor(
                private scope: KernelExecutionScope.Interface,
                private decoratee: RootContainerFactory.Interface
            ) {}

            get() {
                const current = this.scope.getCurrent();
                executionsSeenByRoot.push(current?.executionId);
                return this.decoratee.get();
            }
        }

        const observingDecorator = RootContainerFactory.createDecorator({
            decorator: ObservingRootContainerFactory,
            dependencies: [KernelExecutionScope]
        });

        const app = Kernel.init({
            root: container => {
                container.register(anyInputType);
                container.register(okHandler);
            },
            app: container => {
                container.registerDecorator(observingDecorator);
            }
        });

        expect(await app.handle({})).toBe("ok");
        expect(executionsSeenByRoot).toEqual([undefined]);
    });

    it("can be decorated to wrap a whole execution", async () => {
        const calls: string[] = [];

        class RecordingRunner implements KernelExecutionRunner.Interface {
            constructor(private decoratee: KernelExecutionRunner.Interface) {}

            async execute(rawArgs: any[]) {
                calls.push("before");
                const result = await this.decoratee.execute(rawArgs);
                calls.push(`after:${result}`);
                return result;
            }
        }

        const recordingDecorator = KernelExecutionRunner.createDecorator({
            decorator: RecordingRunner,
            dependencies: []
        });

        const app = Kernel.init({
            root: container => {
                container.register(anyInputType);
                container.register(okHandler);
            },
            app: container => {
                container.registerDecorator(recordingDecorator);
            }
        });

        await app.handle({});
        expect(calls).toEqual(["before", "after:ok"]);
    });
});
