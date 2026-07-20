import { describe, it, expect } from "vitest";
import { EventHandler, EventType, RequestInitializer } from "@webiny/event-handler-core";
import type { IEventHandler, EventContext } from "@webiny/event-handler-core";
import type { NextFunction } from "@webiny/event-handler-core";
import { createLambdaHandler } from "~/createLambdaHandler.js";

describe("createLambdaHandler — RequestInitializer", () => {
    class HttpEventType implements EventType.Interface {
        canHandle(e: any): e is any {
            return !!e.method;
        }
        getHandlerAbstraction() {
            return EventHandler;
        }
    }
    const httpType = EventType.createImplementation({
        implementation: HttpEventType,
        dependencies: []
    });

    const httpEvent = {
        method: "GET",
        path: "/",
        headers: {},
        query: {},
        pathParameters: {},
        body: undefined
    };

    it("runs initializers (awaited, in registration order) before the handler", async () => {
        const order: string[] = [];

        class OrderTrackingHandler implements IEventHandler {
            async execute(_ctx: EventContext, _next: NextFunction) {
                order.push("handler");
                return "ok";
            }
        }
        const handler = EventHandler.createImplementation({
            implementation: OrderTrackingHandler,
            dependencies: []
        });

        class InitializerA implements RequestInitializer.Interface {
            async init() {
                await Promise.resolve();
                order.push("a");
            }
        }
        const initA = RequestInitializer.createImplementation({
            implementation: InitializerA,
            dependencies: []
        });

        class InitializerB implements RequestInitializer.Interface {
            async init() {
                order.push("b");
            }
        }
        const initB = RequestInitializer.createImplementation({
            implementation: InitializerB,
            dependencies: []
        });

        const invoke = createLambdaHandler({
            root: container => {
                container.register(httpType);
                container.register(handler);
                container.register(initA);
                container.register(initB);
            }
        });

        await invoke(httpEvent);

        expect(order).toEqual(["a", "b", "handler"]);
    });

    it("works with no initializers registered", async () => {
        class OkHandler implements IEventHandler {
            async execute() {
                return "ok";
            }
        }
        const handler = EventHandler.createImplementation({
            implementation: OkHandler,
            dependencies: []
        });

        const invoke = createLambdaHandler({
            root: container => {
                container.register(httpType);
                container.register(handler);
            }
        });

        expect(await invoke(httpEvent)).toBe("ok");
    });
});
