import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { HttpEventHandler } from "~/features/events/EventHandler.js";
import { EventType } from "~/features/events/EventType.js";
import type { IEventType } from "~/features/events/EventType.js";
import type { IEventHandler, EventContext } from "~/features/events/EventHandler.js";
import type { NextFunction } from "~/features/events/types.js";
import { createHandler } from "~/features/events/createHandler.js";

const makeEventType = (canHandle: (e: any) => boolean): IEventType => ({
    canHandle: (e): e is any => canHandle(e),
    getHandlerAbstraction: () => HttpEventHandler
});

describe("EventType dispatch", () => {
    it("should route to correct handler based on canHandle", async () => {
        const httpType = EventType.createImplementation({
            implementation: class {
                canHandle(e: any): e is any {
                    return !!e.method;
                }
                getHandlerAbstraction() {
                    return HttpEventHandler;
                }
            },
            dependencies: []
        });

        const handler = HttpEventHandler.createImplementation({
            implementation: class implements IEventHandler {
                async execute(ctx: EventContext, _next: NextFunction) {
                    return { handled: true, event: ctx.event };
                }
            },
            dependencies: []
        });

        const invoke = createHandler({
            root: container => {
                container.register(httpType);
                container.register(handler);
            }
        });

        const result = await invoke({
            method: "GET",
            path: "/test",
            headers: {},
            query: {},
            pathParameters: {},
            body: undefined
        });
        expect(result.handled).toBe(true);
    });

    it("should throw when no event type matches", async () => {
        const httpType = EventType.createImplementation({
            implementation: class {
                canHandle(e: any): e is any {
                    return !!e.method;
                }
                getHandlerAbstraction() {
                    return HttpEventHandler;
                }
            },
            dependencies: []
        });

        const invoke = createHandler({
            root: container => {
                container.register(httpType);
            }
        });

        await expect(invoke({ Records: [{ eventSource: "aws:s3" }] })).rejects.toThrow(
            "No event type matched the incoming event"
        );
    });

    it("should isolate handler pools between event types", async () => {
        const { Abstraction } = await import("@webiny/di");
        const OtherHandler = new Abstraction<IEventHandler>("OtherHandler");

        const httpType = EventType.createImplementation({
            implementation: class {
                canHandle(e: any): e is any {
                    return !!e.method;
                }
                getHandlerAbstraction() {
                    return HttpEventHandler;
                }
            },
            dependencies: []
        });

        const otherType = EventType.createImplementation({
            implementation: class {
                canHandle(e: any): e is any {
                    return !!e.Records;
                }
                getHandlerAbstraction() {
                    return OtherHandler;
                }
            },
            dependencies: []
        });

        const httpHandler = HttpEventHandler.createImplementation({
            implementation: class implements IEventHandler {
                async execute(_ctx: EventContext, _next: NextFunction) {
                    return "http";
                }
            },
            dependencies: []
        });

        const otherHandler = OtherHandler.createImplementation({
            implementation: class implements IEventHandler {
                async execute(_ctx: EventContext, _next: NextFunction) {
                    return "other";
                }
            },
            dependencies: []
        });

        const invoke = createHandler({
            root: container => {
                container.register(httpType);
                container.register(otherType);
                container.register(httpHandler);
                container.register(otherHandler);
            }
        });

        expect(
            await invoke({
                method: "GET",
                path: "/",
                headers: {},
                query: {},
                pathParameters: {},
                body: undefined
            })
        ).toBe("http");
        expect(await invoke({ Records: [{}] })).toBe("other");
    });
});
