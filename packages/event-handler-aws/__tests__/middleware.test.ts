import { describe, it, expect } from "vitest";
import { createLambdaHandler } from "~/createLambdaHandler.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import {
    SnsEventHandler,
    SnsEventType,
    ApiGatewayEventType,
    ApiGatewayTranslator,
    type APIGatewayEvent,
    type SNSEvent,
    type SnsResult
} from "~/index.js";
import { HttpEventHandler } from "@webiny/event-handler-core";

describe("Middleware Pattern", () => {
    it("should call handlers in registration order", async () => {
        const logs: string[] = [];

        const Handler1 = HttpEventHandler.createImplementation({
            implementation: class {
                async execute(_ctx: EventContext, next: NextFunction) {
                    logs.push("Handler1");
                    return next();
                }
            },
            dependencies: []
        });

        const Handler2 = HttpEventHandler.createImplementation({
            implementation: class {
                async execute(_ctx: EventContext, next: NextFunction) {
                    logs.push("Handler2");
                    return next();
                }
            },
            dependencies: []
        });

        const Handler3 = HttpEventHandler.createImplementation({
            implementation: class {
                async execute(_ctx: EventContext, _next: NextFunction) {
                    logs.push("Handler3");
                    return { statusCode: 200, headers: {}, body: "" };
                }
            },
            dependencies: []
        });

        const handler = createLambdaHandler({
            root: container => {
                container.register(ApiGatewayEventType);
                container.register(ApiGatewayTranslator);
                container.register(Handler1);
                container.register(Handler2);
                container.register(Handler3);
            }
        });

        await handler({
            httpMethod: "GET",
            path: "/test",
            headers: {},
            requestContext: { requestId: "test" } as any,
            body: null,
            isBase64Encoded: false
        } as APIGatewayEvent);

        expect(logs).toEqual(["Handler1", "Handler2", "Handler3"]);
    });

    it("should return result from the first handler that handles the event", async () => {
        const ApiHandler = HttpEventHandler.createImplementation({
            implementation: class {
                async execute(ctx: EventContext, next: NextFunction): Promise<any> {
                    if (ctx.event?.method !== "GET") {
                        return next();
                    }
                    return {
                        statusCode: 200,
                        headers: {},
                        body: JSON.stringify({ handler: "api-gateway" })
                    };
                }
            },
            dependencies: []
        });

        const handler = createLambdaHandler({
            root: container => {
                container.register(ApiGatewayEventType);
                container.register(ApiGatewayTranslator);
                container.register(ApiHandler);
            }
        });

        const result = await handler({
            httpMethod: "GET",
            path: "/test",
            headers: {},
            requestContext: { requestId: "test" } as any,
            body: null,
            isBase64Encoded: false
        } as APIGatewayEvent);

        expect(result.statusCode).toBe(200);
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
                container.register(ApiGatewayTranslator);
            }
        });

        await expect(handler({ unknownField: "value" })).rejects.toThrow(
            "No event type matched the incoming event"
        );
    });
});
