import { describe, it, expect } from "vitest";
import { createLambdaHandler } from "~/createLambdaHandler.js";
import type { InputContext, NextFunction } from "@webiny/kernel-core";
import { HttpFeature } from "@webiny/kernel-core";
import {
    SnsInputHandler,
    SnsInputType,
    ApiGatewayInputType,
    ApiGatewayHttpRouterHandler,
    type APIGatewayEvent,
    type SNSEvent,
    type SnsResult
} from "~/index.js";
import { ApiGatewayInputHandler } from "~/abstractions/handlers/ApiGatewayInputHandler.js";

const apiGwEvent = {
    httpMethod: "GET",
    path: "/test",
    headers: {},
    requestContext: { requestId: "test" } as any,
    body: null,
    isBase64Encoded: false
} as APIGatewayEvent;

describe("Middleware Pattern — ApiGatewayInputHandler decorators", () => {
    it("should run decorators outermost-first then terminal handler", async () => {
        const logs: string[] = [];

        // Decorators: last-registered = outermost = first to execute
        const Decorator1 = ApiGatewayInputHandler.createDecorator({
            decorator: class {
                constructor(private inner: ApiGatewayInputHandler.Interface) {}
                async execute(ctx: InputContext, next: NextFunction) {
                    logs.push("Decorator1");
                    return this.inner.execute(ctx, next);
                }
            },
            dependencies: []
        });

        const Decorator2 = ApiGatewayInputHandler.createDecorator({
            decorator: class {
                constructor(private inner: ApiGatewayInputHandler.Interface) {}
                async execute(ctx: InputContext, next: NextFunction) {
                    logs.push("Decorator2");
                    return this.inner.execute(ctx, next);
                }
            },
            dependencies: []
        });

        const handler = createLambdaHandler({
            root: container => {
                container.register(ApiGatewayInputType);
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
        const ShortCircuit = ApiGatewayInputHandler.createDecorator({
            decorator: class {
                constructor(private inner: ApiGatewayInputHandler.Interface) {}
                async execute(ctx: InputContext<APIGatewayEvent>, next: NextFunction) {
                    if ((ctx.input as any).httpMethod === "GET") {
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
                container.register(ApiGatewayInputType);
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
        class SnsHandlerImplementation implements SnsInputHandler.Interface {
            async execute(ctx: InputContext<SNSEvent>, _next: NextFunction): Promise<SnsResult> {
                return { success: true, processedRecords: ctx.input.Records.length };
            }
        }
        const SnsHandler = SnsInputHandler.createImplementation({
            implementation: SnsHandlerImplementation,
            dependencies: []
        });

        const handler = createLambdaHandler({
            root: container => {
                container.register(SnsInputType);
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
                container.register(ApiGatewayInputType);
                HttpFeature.register(container);
                container.register(ApiGatewayHttpRouterHandler);
            }
        });

        await expect(handler({ unknownField: "value" })).rejects.toThrow(
            "No input type matched the incoming input"
        );
    });
});
