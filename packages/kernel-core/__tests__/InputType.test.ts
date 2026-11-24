import { describe, it, expect } from "vitest";
import { InputHandler } from "~/features/events/InputHandler.js";
import { InputType } from "~/features/events/InputType.js";
import type { IInputHandler, InputContext } from "~/features/events/InputHandler.js";
import type { NextFunction } from "~/features/events/types.js";
import { Kernel } from "~/features/events/Kernel.js";

describe("InputType dispatch", () => {
    it("should route to correct handler based on canHandle", async () => {
        class HttpInputType implements InputType.Interface {
            matches(input: any): input is any {
                return !!input.method;
            }
            getHandlerAbstraction() {
                return InputHandler;
            }
        }
        const httpType = InputType.createImplementation({
            implementation: HttpInputType,
            dependencies: []
        });

        class HttpHandler implements IInputHandler {
            async execute(ctx: InputContext, _next: NextFunction) {
                return { handled: true, event: ctx.input };
            }
        }
        const handler = InputHandler.createImplementation({
            implementation: HttpHandler,
            dependencies: []
        });

        const app = Kernel.init({
            root: container => {
                container.register(httpType);
                container.register(handler);
            }
        });

        const result = await app.handle({
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
        class HttpInputType implements InputType.Interface {
            matches(input: any): input is any {
                return !!input.method;
            }
            getHandlerAbstraction() {
                return InputHandler;
            }
        }
        const httpType = InputType.createImplementation({
            implementation: HttpInputType,
            dependencies: []
        });

        const app = Kernel.init({
            root: container => {
                container.register(httpType);
            }
        });

        await expect(app.handle({ Records: [{ eventSource: "aws:s3" }] })).rejects.toThrow(
            "No input type matched the incoming input"
        );
    });

    it("should isolate handler pools between event types", async () => {
        const { Abstraction } = await import("@webiny/di");
        const OtherHandler = new Abstraction<IInputHandler>("OtherHandler");

        class HttpInputType implements InputType.Interface {
            matches(input: any): input is any {
                return !!input.method;
            }
            getHandlerAbstraction() {
                return InputHandler;
            }
        }
        const httpType = InputType.createImplementation({
            implementation: HttpInputType,
            dependencies: []
        });

        class OtherInputType implements InputType.Interface {
            matches(input: any): input is any {
                return !!input.Records;
            }
            getHandlerAbstraction() {
                return OtherHandler;
            }
        }
        const otherType = InputType.createImplementation({
            implementation: OtherInputType,
            dependencies: []
        });

        class HttpEventHandler implements IInputHandler {
            async execute(_ctx: InputContext, _next: NextFunction) {
                return "http";
            }
        }
        const httpHandler = InputHandler.createImplementation({
            implementation: HttpEventHandler,
            dependencies: []
        });

        class OtherEventHandler implements IInputHandler {
            async execute(_ctx: InputContext, _next: NextFunction) {
                return "other";
            }
        }
        const otherHandler = OtherHandler.createImplementation({
            implementation: OtherEventHandler,
            dependencies: []
        });

        const app = Kernel.init({
            root: container => {
                container.register(httpType);
                container.register(otherType);
                container.register(httpHandler);
                container.register(otherHandler);
            }
        });

        expect(
            await app.handle({
                method: "GET",
                path: "/",
                headers: {},
                query: {},
                pathParameters: {},
                body: undefined
            })
        ).toBe("http");
        expect(await app.handle({ Records: [{}] })).toBe("other");
    });
});
