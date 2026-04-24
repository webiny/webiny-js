import { describe, it, expect } from "vitest";
import { createFunction } from "~/createFunction.js";
import type { NextFunction } from "~/types.js";
import {
    ApiGatewayEventHandler,
    SnsEventHandler,
    type APIGatewayEvent,
    type APIGatewayProxyResult,
    type SNSEvent,
    type SnsResult
} from "~/index.js";

describe("Middleware Pattern", () => {
    it("should call handlers in registration order", async () => {
        const logs: string[] = [];

        const Handler1 = ApiGatewayEventHandler.createImplementation({
            implementation: class {
                async execute(_event: any, next: NextFunction) {
                    logs.push("Handler1");
                    return next();
                }
            },
            dependencies: []
        });

        const Handler2 = ApiGatewayEventHandler.createImplementation({
            implementation: class {
                async execute(_event: any, next: NextFunction) {
                    logs.push("Handler2");
                    return next();
                }
            },
            dependencies: []
        });

        const Handler3 = ApiGatewayEventHandler.createImplementation({
            implementation: class {
                async execute(_event: any, _next: NextFunction) {
                    logs.push("Handler3");
                    return { statusCode: 200, headers: {}, body: "" };
                }
            },
            dependencies: []
        });

        const handler = createFunction(container => {
            container.register(Handler1);
            container.register(Handler2);
            container.register(Handler3);
        });

        await handler({ test: "event" });

        expect(logs).toEqual(["Handler1", "Handler2", "Handler3"]);
    });

    it("should return result from the first handler that handles the event", async () => {
        const ApiHandler = ApiGatewayEventHandler.createImplementation({
            implementation: class implements ApiGatewayEventHandler.Interface {
                async execute(
                    event: APIGatewayEvent,
                    next: NextFunction
                ): Promise<APIGatewayProxyResult> {
                    if (!event.httpMethod) return next();
                    return {
                        statusCode: 200,
                        headers: {},
                        body: JSON.stringify({ handler: "api-gateway" })
                    };
                }
            },
            dependencies: []
        });

        const handler = createFunction(container => {
            container.register(ApiHandler);
        });

        const result = await handler({
            httpMethod: "GET",
            path: "/test",
            headers: {},
            requestContext: {} as any,
            body: null,
            isBase64Encoded: false
        } as APIGatewayEvent);

        expect(result).toEqual({
            statusCode: 200,
            headers: {},
            body: JSON.stringify({ handler: "api-gateway" })
        });
    });

    it("should route through mixed handler types via next()", async () => {
        const ApiHandler = ApiGatewayEventHandler.createImplementation({
            implementation: class {
                async execute(event: any, next: NextFunction) {
                    if (!event.httpMethod) return next();
                    return { statusCode: 200, headers: {}, body: "" };
                }
            },
            dependencies: []
        });

        const SnsHandler = SnsEventHandler.createImplementation({
            implementation: class implements SnsEventHandler.Interface {
                async execute(event: SNSEvent, next: NextFunction): Promise<SnsResult> {
                    if (
                        !Array.isArray(event.Records) ||
                        event.Records[0]?.EventSource !== "aws:sns"
                    ) {
                        return next();
                    }
                    return { success: true, processedRecords: event.Records.length };
                }
            },
            dependencies: []
        });

        const handler = createFunction(container => {
            container.register(ApiHandler);
            container.register(SnsHandler);
        });

        const result = await handler({
            Records: [{ EventSource: "aws:sns", Sns: { Message: "{}", MessageId: "123" } }]
        });

        expect(result).toEqual({ success: true, processedRecords: 1 });
    });

    it("should throw when no handler claims the event", async () => {
        const ApiHandler = ApiGatewayEventHandler.createImplementation({
            implementation: class {
                async execute(event: any, next: NextFunction) {
                    if (!event.httpMethod) return next();
                    return { statusCode: 200, headers: {}, body: "" };
                }
            },
            dependencies: []
        });

        const handler = createFunction(container => {
            container.register(ApiHandler);
        });

        await expect(handler({ unknownField: "value" })).rejects.toThrow(
            "No registered function implementation handled this event"
        );
    });
});
