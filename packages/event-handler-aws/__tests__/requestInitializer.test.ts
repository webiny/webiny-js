import { describe, it, expect } from "vitest";
import { EventHandler, EventType, RequestInitializer } from "@webiny/event-handler-core";
import type { IEventHandler, EventContext } from "@webiny/event-handler-core";
import type { NextFunction } from "@webiny/event-handler-core";
import { createLambdaHandler } from "~/createLambdaHandler.js";

describe("createLambdaHandler — RequestInitializer", () => {
    const httpType = EventType.createImplementation({
        implementation: class {
            canHandle(e: any): e is any {
                return !!e.method;
            }
            getHandlerAbstraction() {
                return EventHandler;
            }
        },
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

        const handler = EventHandler.createImplementation({
            implementation: class implements IEventHandler {
                async execute(_ctx: EventContext, _next: NextFunction) {
                    order.push("handler");
                    return "ok";
                }
            },
            dependencies: []
        });

        const initA = RequestInitializer.createImplementation({
            implementation: class implements RequestInitializer.Interface {
                async init() {
                    await Promise.resolve();
                    order.push("a");
                }
            },
            dependencies: []
        });

        const initB = RequestInitializer.createImplementation({
            implementation: class implements RequestInitializer.Interface {
                async init() {
                    order.push("b");
                }
            },
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
        const handler = EventHandler.createImplementation({
            implementation: class implements IEventHandler {
                async execute() {
                    return "ok";
                }
            },
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
