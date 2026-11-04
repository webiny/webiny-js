import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { EventHandler } from "~/features/events/EventHandler.js";
import { EventType } from "~/features/events/EventType.js";
import { HandlerApp } from "~/features/events/HandlerApp.js";
import { HandlerExecution } from "~/features/events/HandlerExecution.js";
import { RequestId } from "~/features/events/RequestId.js";
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
        constructor(
            private handlerExecution: HandlerExecution.Interface,
            private requestId: RequestId.Interface
        ) {}

        async execute() {
            this.handlerExecution.assertCurrent("Test");
            return [this.handlerExecution.getId(), this.requestId.value];
        }
    }

    const readExecutionHandler = EventHandler.createImplementation({
        implementation: ReadExecutionHandler,
        dependencies: [HandlerExecution, RequestId]
    });

    it("passes inside its own execution, and RequestId defaults to the execution id", async () => {
        const app = HandlerApp.init({
            root: container => {
                container.register(anyEventType);
                container.register(readExecutionHandler);
            }
        });

        const [executionId, requestId] = await app.handle({});
        expect(executionId).toBe(requestId);
    });

    it("keeps its own id when the transport replaces RequestId", async () => {
        const app = HandlerApp.init({
            transport: {
                bind(container) {
                    container.registerInstance(RequestId, { value: "aws-request" });
                }
            },
            root: container => {
                container.register(anyEventType);
                container.register(readExecutionHandler);
            }
        });

        const [executionId, requestId] = await app.handle({});
        expect(requestId).toBe("aws-request");
        expect(executionId).not.toBe("aws-request");
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
