import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { EventHandler } from "~/features/events/EventHandler.js";
import { EventType } from "~/features/events/EventType.js";
import type { IEventType } from "~/features/events/EventType.js";
import type { IEventHandler } from "~/features/events/EventHandler.js";
import { HandlerApp } from "~/features/events/HandlerApp.js";
import { HandlerExecution } from "~/features/events/HandlerExecution.js";
import { RequestId } from "~/features/events/RequestId.js";
import { StaleHandlerExecutionError } from "~/features/events/HandlerExecutionScope.js";

class AnyEventType implements IEventType {
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
    it("is the container's own handler execution, and passes inside it", async () => {
        class ReadExecutionHandler implements IEventHandler {
            constructor(
                private handlerExecution: HandlerExecution.Interface,
                private requestId: RequestId.Interface
            ) {}

            async execute() {
                this.handlerExecution.assertCurrent("Test");
                return [this.handlerExecution.getId(), this.requestId.value];
            }
        }

        const app = HandlerApp.init({
            root: container => {
                container.register(anyEventType);
                container.register(
                    EventHandler.createImplementation({
                        implementation: ReadExecutionHandler,
                        dependencies: [HandlerExecution, RequestId]
                    })
                );
            }
        });

        const [executionId, requestId] = await app.handle({});
        expect(executionId).toBe(requestId);
    });

    it("throws when a later handler execution uses an earlier one's instance", async () => {
        const kept: HandlerExecution.Interface[] = [];

        class KeepExecutionHandler implements IEventHandler {
            constructor(private handlerExecution: HandlerExecution.Interface) {}

            async execute() {
                kept.push(this.handlerExecution);
                kept[0].assertCurrent("Test");
                return "ok";
            }
        }

        const app = HandlerApp.init({
            root: container => {
                container.register(anyEventType);
                container.register(
                    EventHandler.createImplementation({
                        implementation: KeepExecutionHandler,
                        dependencies: [HandlerExecution]
                    })
                );
            }
        });

        expect(await app.handle({})).toBe("ok");
        await expect(app.handle({})).rejects.toThrow(StaleHandlerExecutionError);
    });
});
