import { describe, it, expect } from "vitest";
import { EventHandler } from "~/features/events/EventHandler.js";
import { EventType } from "~/features/events/EventType.js";
import type { IEventHandler, EventContext } from "~/features/events/EventHandler.js";
import type { NextFunction } from "~/features/events/types.js";
import { createHandler } from "~/features/events/createHandler.js";

describe("EventType dispatch", () => {
    it("should route to correct handler based on canHandle", async () => {
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

        class HttpHandler implements IEventHandler {
            async execute(ctx: EventContext, _next: NextFunction) {
                return { handled: true, event: ctx.event };
            }
        }
        const handler = EventHandler.createImplementation({
            implementation: HttpHandler,
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

        class OtherEventType implements EventType.Interface {
            canHandle(e: any): e is any {
                return !!e.Records;
            }
            getHandlerAbstraction() {
                return OtherHandler;
            }
        }
        const otherType = EventType.createImplementation({
            implementation: OtherEventType,
            dependencies: []
        });

        class HttpEventHandler implements IEventHandler {
            async execute(_ctx: EventContext, _next: NextFunction) {
                return "http";
            }
        }
        const httpHandler = EventHandler.createImplementation({
            implementation: HttpEventHandler,
            dependencies: []
        });

        class OtherEventHandler implements IEventHandler {
            async execute(_ctx: EventContext, _next: NextFunction) {
                return "other";
            }
        }
        const otherHandler = OtherHandler.createImplementation({
            implementation: OtherEventHandler,
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
