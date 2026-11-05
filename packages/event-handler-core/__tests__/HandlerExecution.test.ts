import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { EventHandler } from "~/features/events/EventHandler.js";
import { EventType } from "~/features/events/EventType.js";
import { HandlerApp } from "~/features/events/HandlerApp.js";
import { HandlerExecution } from "~/features/events/HandlerExecution.js";
import { StaleHandlerExecutionError } from "~/features/events/StaleHandlerExecutionError.js";

class AnyEventType implements EventType.Interface {
    canHandle(_event: any): _event is any {
        return true;
    }
    getHandlerAbstraction() {
        return EventHandler;
    }
}

const anyEventType = EventType.createImplementation({
    implementation: AnyEventType,
    dependencies: []
});

describe("HandlerExecution", () => {
    class ReadExecutionHandler implements EventHandler.Interface {
        constructor(private handlerExecution: HandlerExecution.Interface) {}

        async execute() {
            this.handlerExecution.assertCurrent("Test");
            return this.handlerExecution.getId();
        }
    }

    const readExecutionHandler = EventHandler.createImplementation({
        implementation: ReadExecutionHandler,
        dependencies: [HandlerExecution]
    });

    it("passes inside its own execution, with a generated id per execution", async () => {
        const app = HandlerApp.init({
            root: container => {
                container.register(anyEventType);
                container.register(readExecutionHandler);
            }
        });

        const first = await app.handle({});
        const second = await app.handle({});
        expect(first).toMatch(/^[0-9a-f-]{36}$/);
        expect(second).not.toBe(first);
    });

    it("takes its id from the transport when the transport has one", async () => {
        const app = HandlerApp.init({
            transport: {
                bind() {},
                getExecutionId(_event: unknown, context?: { requestId: string }) {
                    return context?.requestId;
                }
            },
            root: container => {
                container.register(anyEventType);
                container.register(readExecutionHandler);
            }
        });

        const fromTransport = await app.handle({}, { requestId: "platform-request" });
        const generated = await app.handle({});
        expect(fromTransport).toBe("platform-request");
        expect(generated).toMatch(/^[0-9a-f-]{36}$/);
    });

    it("tells two executions apart even when the transport gives them the same id", async () => {
        const kept: HandlerExecution.Interface[] = [];

        class KeepFirstExecutionHandler implements EventHandler.Interface {
            constructor(private handlerExecution: HandlerExecution.Interface) {}

            async execute() {
                kept.push(this.handlerExecution);
                kept[0].assertCurrent("Test");
                return kept[0].getId();
            }
        }

        const keepFirstExecutionHandler = EventHandler.createImplementation({
            implementation: KeepFirstExecutionHandler,
            dependencies: [HandlerExecution]
        });

        const app = HandlerApp.init({
            transport: {
                bind() {},
                getExecutionId() {
                    return "retried-request";
                }
            },
            root: container => {
                container.register(anyEventType);
                container.register(keepFirstExecutionHandler);
            }
        });

        expect(await app.handle({})).toBe("retried-request");
        await expect(app.handle({})).rejects.toThrow(
            'belongs to handler execution "retried-request" but was used during a later handler execution with the same id'
        );
    });

    it("checks container setup too", async () => {
        const kept: HandlerExecution.Interface[] = [];

        const app = HandlerApp.init({
            root: container => {
                container.register(anyEventType);
                container.register(readExecutionHandler);
            },
            child: container => {
                const handlerExecution = container.resolve(HandlerExecution);
                kept.push(handlerExecution);
                kept[0].assertCurrent("Setup");
            }
        });

        await app.handle({});
        await expect(app.handle({})).rejects.toThrow(StaleHandlerExecutionError);
    });

    it("throws when a later handler execution uses an earlier one's instance", async () => {
        const kept: HandlerExecution.Interface[] = [];

        class KeepExecutionHandler implements EventHandler.Interface {
            constructor(private handlerExecution: HandlerExecution.Interface) {}

            async execute() {
                kept.push(this.handlerExecution);
                kept[0].assertCurrent("Test");
                return "ok";
            }
        }

        const keepExecutionHandler = EventHandler.createImplementation({
            implementation: KeepExecutionHandler,
            dependencies: [HandlerExecution]
        });

        const app = HandlerApp.init({
            root: container => {
                container.register(anyEventType);
                container.register(keepExecutionHandler);
            }
        });

        expect(await app.handle({})).toBe("ok");
        await expect(app.handle({})).rejects.toThrow(StaleHandlerExecutionError);
    });
});
