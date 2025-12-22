/**
 * Test: Middleware Pattern
 *
 * This test demonstrates how the middleware pattern works with multiple handlers.
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { Container } from "@webiny/di";
import { createFunction } from "../createFunction";
import type { NextFunction } from "../types";
import {
    ApiGatewayFunction,
    SnsFunction,
    type APIGatewayEvent,
    type APIGatewayProxyResult,
    type SNSEvent,
    type SnsResult
} from "../index";

// Mock Logger
const Logger = {
    abstraction: { name: "Logger" },
    implementation: class MockLogger {
        logs: string[] = [];
        info(msg: string) {
            this.logs.push(`INFO: ${msg}`);
        }
    },
    dependencies: []
};

// API Gateway Handler
class TestApiGatewayHandlerImpl implements ApiGatewayFunction.Interface {
    constructor(private logger: any) {}

    async execute(event: APIGatewayEvent, next: NextFunction): Promise<APIGatewayProxyResult> {
        this.logger.info("ApiGateway handler called");

        // Middleware check
        if (!event.httpMethod) {
            this.logger.info("Not an API Gateway event, calling next()");
            return next();
        }

        this.logger.info("Processing API Gateway event");
        return {
            statusCode: 200,
            headers: {},
            body: JSON.stringify({ handler: "api-gateway" })
        };
    }
}

const TestApiGatewayHandler = ApiGatewayFunction.createImplementation({
    implementation: TestApiGatewayHandlerImpl,
    dependencies: [Logger.abstraction]
});

// SNS Handler
class TestSnsHandlerImpl implements SnsFunction.Interface {
    constructor(private logger: any) {}

    async execute(event: SNSEvent, next: NextFunction): Promise<SnsResult> {
        this.logger.info("SNS handler called");

        // Middleware check
        if (!Array.isArray(event.Records) || event.Records[0]?.EventSource !== "aws:sns") {
            this.logger.info("Not an SNS event, calling next()");
            return next();
        }

        this.logger.info("Processing SNS event");
        return {
            success: true,
            processedRecords: event.Records.length,
            message: "Processed by SNS handler"
        };
    }
}

const TestSnsHandler = SnsFunction.createImplementation({
    implementation: TestSnsHandlerImpl,
    dependencies: [Logger.abstraction]
});

describe("Middleware Pattern", () => {
    it("should route API Gateway event to correct handler", async () => {
        const handler = createFunction((container) => {
            container.register(Logger);
            container.register(TestApiGatewayHandler);
            container.register(TestSnsHandler);
        });

        const apiGatewayEvent = {
            httpMethod: "GET",
            path: "/test",
            headers: {},
            requestContext: {} as any,
            body: null,
            isBase64Encoded: false
        } as APIGatewayEvent;

        const result = await handler(apiGatewayEvent);

        expect(result).toEqual({
            statusCode: 200,
            headers: {},
            body: JSON.stringify({ handler: "api-gateway" })
        });
    });

    it("should route SNS event to correct handler via middleware chain", async () => {
        const handler = createFunction((container) => {
            container.register(Logger);
            // Register API Gateway first - it will call next()
            container.register(TestApiGatewayHandler);
            // SNS handler will process the event
            container.register(TestSnsHandler);
        });

        const snsEvent = {
            Records: [
                {
                    EventSource: "aws:sns",
                    Sns: {
                        Message: JSON.stringify({ test: "data" }),
                        MessageId: "123"
                    }
                }
            ]
        } as SNSEvent;

        const result = await handler(snsEvent);

        expect(result).toEqual({
            success: true,
            processedRecords: 1,
            message: "Processed by SNS handler"
        });
    });

    it("should throw error if no handler processes the event", async () => {
        const handler = createFunction((container) => {
            container.register(Logger);
            container.register(TestApiGatewayHandler);
            container.register(TestSnsHandler);
        });

        const unknownEvent = {
            someUnknownField: "value"
        };

        await expect(handler(unknownEvent)).rejects.toThrow(
            "No registered function implementation handled this event"
        );
    });

    it("should call handlers in registration order", async () => {
        const logs: string[] = [];

        const Handler1 = ApiGatewayFunction.createImplementation({
            implementation: class {
                async execute(_event: any, next: NextFunction) {
                    logs.push("Handler1");
                    return next();
                }
            },
            dependencies: []
        });

        const Handler2 = ApiGatewayFunction.createImplementation({
            implementation: class {
                async execute(_event: any, next: NextFunction) {
                    logs.push("Handler2");
                    return next();
                }
            },
            dependencies: []
        });

        const Handler3 = ApiGatewayFunction.createImplementation({
            implementation: class {
                async execute(_event: any, _next: NextFunction) {
                    logs.push("Handler3");
                    return { statusCode: 200, headers: {}, body: "" };
                }
            },
            dependencies: []
        });

        const handler = createFunction((container) => {
            container.register(Handler1);
            container.register(Handler2);
            container.register(Handler3);
        });

        await handler({ test: "event" });

        expect(logs).toEqual(["Handler1", "Handler2", "Handler3"]);
    });
});

