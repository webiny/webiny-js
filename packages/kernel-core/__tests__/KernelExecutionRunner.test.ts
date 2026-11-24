import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { EventHandler } from "~/features/events/EventHandler.js";
import { EventType } from "~/features/events/EventType.js";
import { Kernel } from "~/features/events/Kernel.js";
import { KernelExecutionRunner } from "~/features/events/abstractions.js";
import { RootContainerFactory } from "~/features/events/abstractions.js";
import { KernelExecutionScope } from "~/features/events/KernelExecutionScope.js";

class AnyEventType implements EventType.Interface {
    canHandle(_event: any): _event is any {
        return true;
    }
    getHandlerAbstraction() {
        return EventHandler;
    }
}

class OkHandler implements EventHandler.Interface {
    async execute() {
        return "ok";
    }
}

const anyEventType = EventType.createImplementation({
    implementation: AnyEventType,
    dependencies: []
});

const okHandler = EventHandler.createImplementation({
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
                container.register(anyEventType);
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
                container.register(anyEventType);
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
