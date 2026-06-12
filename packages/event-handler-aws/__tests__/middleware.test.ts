import { describe, it, expect } from "vitest";
import { createLambdaHandler } from "~/createLambdaHandler.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { HttpFeature } from "@webiny/event-handler-core";
import {
    SnsEventHandler,
    SnsEventType,
    ApiGatewayEventType,
    ApiGatewayHttpRouterHandler,
    type APIGatewayEvent,
    type SNSEvent,
    type SnsResult
} from "~/index.js";
import { ApiGatewayEventHandler } from "~/abstractions/handlers/ApiGatewayEventHandler.js";

const apiGwEvent = {
    httpMethod: "GET",
    path: "/test",
    headers: {},
    requestContext: { requestId: "test" } as any,
    body: null,
    isBase64Encoded: false
} as APIGatewayEvent;

describe("Middleware Pattern — ApiGatewayEventHandler decorators", () => {
    it("should run decorators outermost-first then terminal handler", async () => {
        const logs: string[] = [];

        // Decorators: last-registered = outermost = first to execute
        const Decorator1 = ApiGatewayEventHandler.createDecorator({
            decorator: class {
                constructor(private inner: ApiGatewayEventHandler.Interface) {}
                async execute(ctx: EventContext, next: NextFunction) {
                    logs.push("Decorator1");
                    return this.inner.execute(ctx, next);
                }
            },
            dependencies: []
        });

        const Decorator2 = ApiGatewayEventHandler.createDecorator({
            decorator: class {
                constructor(private inner: ApiGatewayEventHandler.Interface) {}
                async execute(ctx: EventContext, next: NextFunction) {
                    logs.push("Decorator2");
                    return this.inner.execute(ctx, next);
                }
            },
            dependencies: []
        });

        const handler = createLambdaHandler({
            root: container => {
                container.register(ApiGatewayEventType);
                HttpFeature.register(container);
                container.register(ApiGatewayHttpRouterHandler);
                // Last registered = outermost
                container.registerDecorator(Decorator1);
                container.registerDecorator(Decorator2);
            }
        });

        await handler(apiGwEvent);

        // Decorator2 is outermost (runs first), Decorator1 runs second, terminal last
        expect(logs).toEqual(["Decorator2", "Decorator1"]);
    });

    it("should allow a decorator to short-circuit the chain", async () => {
        const ShortCircuit = ApiGatewayEventHandler.createDecorator({
            decorator: class {
                constructor(private inner: ApiGatewayEventHandler.Interface) {}
                async execute(ctx: EventContext<APIGatewayEvent>, next: NextFunction) {
                    if ((ctx.event as any).httpMethod === "GET") {
                        return {
                            statusCode: 200,
                            headers: {},
                            body: JSON.stringify({ intercepted: true })
                        };
                    }
                    return this.inner.execute(ctx, next);
                }
            },
            dependencies: []
        });

        const handler = createLambdaHandler({
            root: container => {
                container.register(ApiGatewayEventType);
                HttpFeature.register(container);
                container.register(ApiGatewayHttpRouterHandler);
                container.registerDecorator(ShortCircuit);
            }
        });

        const result = await handler(apiGwEvent);
        expect(result.statusCode).toBe(200);
        expect(result.body).toBe(JSON.stringify({ intercepted: true }));
    });

    it("should route SNS events to SNS handlers only", async () => {
        const SnsHandler = SnsEventHandler.createImplementation({
            implementation: class implements SnsEventHandler.Interface {
                async execute(
                    ctx: EventContext<SNSEvent>,
                    _next: NextFunction
                ): Promise<SnsResult> {
                    return { success: true, processedRecords: ctx.event.Records.length };
                }
            },
            dependencies: []
        });

        const handler = createLambdaHandler({
            root: container => {
                container.register(SnsEventType);
                container.register(SnsHandler);
            }
        });

        const result = await handler({
            Records: [{ EventSource: "aws:sns", Sns: { Message: "{}", MessageId: "123" } }]
        });

        expect(result).toEqual({ success: true, processedRecords: 1 });
    });

    it("should throw when no event type matches", async () => {
        const handler = createLambdaHandler({
            root: container => {
                container.register(ApiGatewayEventType);
                HttpFeature.register(container);
                container.register(ApiGatewayHttpRouterHandler);
            }
        });

        await expect(handler({ unknownField: "value" })).rejects.toThrow(
            "No event type matched the incoming event"
        );
    });
});
