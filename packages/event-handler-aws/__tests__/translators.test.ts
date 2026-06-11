import { describe, it, expect } from "vitest";
import { createLambdaHandler } from "~/createLambdaHandler.js";
import {
    ApiGatewayEventType,
    FunctionUrlEventType,
    ApiGatewayTranslator,
    FunctionUrlTranslator,
    AwsHttpTranslator,
    AwsHttpTranslatorApiGateway
} from "~/index.js";
import { HttpEventHandler } from "@webiny/event-handler-core";
import { ApiGatewayEventHandler } from "~/abstractions/handlers/ApiGatewayEventHandler.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";

// Capture handler for API GW chain (ApiGatewayEventHandler pool)
const agwCaptureHandler = ApiGatewayEventHandler.createImplementation({
    implementation: class {
        async execute(ctx: EventContext, _next: NextFunction) {
            return { statusCode: 200, body: ctx.event };
        }
    },
    dependencies: []
});

// Capture handler for Function URL chain (HttpEventHandler pool)
const fnUrlCaptureHandler = HttpEventHandler.createImplementation({
    implementation: class {
        async execute(ctx: EventContext, _next: NextFunction) {
            return { statusCode: 200, body: ctx.event };
        }
    },
    dependencies: []
});

const apiGwEvent = {
    httpMethod: "POST",
    path: "/graphql",
    headers: { "content-type": "application/json", origin: "https://example.com" },
    queryStringParameters: { foo: "bar" },
    pathParameters: { id: "123" },
    requestContext: { requestId: "req-1" },
    body: JSON.stringify({ query: "{ hello }" }),
    isBase64Encoded: false
};

const fnUrlEvent = {
    rawPath: "/graphql",
    rawQueryString: "foo=bar",
    headers: { "content-type": "application/json" },
    queryStringParameters: { foo: "bar" },
    pathParameters: { id: "123" },
    requestContext: {
        http: { method: "POST", path: "/graphql" },
        apiId: "abc123"
    },
    body: JSON.stringify({ query: "{ hello }" }),
    isBase64Encoded: false
};

describe("ApiGatewayTranslator", () => {
    it("should translate APIGatewayProxyEvent to IHttpRequest", async () => {
        const handler = createLambdaHandler({
            root: container => {
                container.register(ApiGatewayEventType);
                container.register(ApiGatewayTranslator);
                container.register(agwCaptureHandler);
            }
        });

        const result = await handler(apiGwEvent);
        const body = JSON.parse(result.body);
        expect(body.method).toBe("POST");
        expect(body.path).toBe("/graphql");
        expect(body.query).toEqual({ foo: "bar" });
        expect(body.body).toEqual({ query: "{ hello }" });
    });

    it("should translate IHttpResponse back to APIGatewayProxyResult", async () => {
        const jsonHandler = ApiGatewayEventHandler.createImplementation({
            implementation: class {
                async execute(_ctx: EventContext, _next: NextFunction) {
                    return { statusCode: 201, headers: { "x-custom": "yes" }, body: { ok: true } };
                }
            },
            dependencies: []
        });

        const handler = createLambdaHandler({
            root: container => {
                container.register(ApiGatewayEventType);
                container.register(ApiGatewayTranslator);
                container.register(jsonHandler);
            }
        });

        const result = await handler(apiGwEvent);
        expect(result.statusCode).toBe(201);
        expect(result.headers["x-custom"]).toBe("yes");
        expect(result.body).toBe(JSON.stringify({ ok: true }));
    });

    it("should set isBase64Encoded for Buffer responses", async () => {
        const bufferHandler = ApiGatewayEventHandler.createImplementation({
            implementation: class {
                async execute(_ctx: EventContext, _next: NextFunction) {
                    return {
                        statusCode: 200,
                        headers: { "content-type": "image/png" },
                        body: Buffer.from("PNG")
                    };
                }
            },
            dependencies: []
        });

        const handler = createLambdaHandler({
            root: container => {
                container.register(ApiGatewayEventType);
                container.register(ApiGatewayTranslator);
                container.register(bufferHandler);
            }
        });

        const result = await handler(apiGwEvent);
        expect(result.isBase64Encoded).toBe(true);
        expect(result.body).toBe(Buffer.from("PNG").toString("base64"));
    });
});

describe("FunctionUrlTranslator", () => {
    it("should translate LambdaFunctionURLEvent to IHttpRequest", async () => {
        const handler = createLambdaHandler({
            root: container => {
                container.register(FunctionUrlEventType);
                container.register(FunctionUrlTranslator);
                container.register(fnUrlCaptureHandler);
            }
        });

        const result = await handler(fnUrlEvent);
        const body = JSON.parse(result.body);
        expect(body.method).toBe("POST");
        expect(body.path).toBe("/graphql");
        expect(body.query).toEqual({ foo: "bar" });
    });
});

describe("AwsHttpTranslator", () => {
    it("should handle API GW events", async () => {
        const handler = createLambdaHandler({
            root: container => {
                container.register(ApiGatewayEventType);
                container.register(FunctionUrlEventType);
                container.register(AwsHttpTranslatorApiGateway);
                container.register(AwsHttpTranslator);
                container.register(agwCaptureHandler);
                container.register(fnUrlCaptureHandler);
            }
        });

        const result = await handler(apiGwEvent);
        expect(JSON.parse(result.body).method).toBe("POST");
        expect(JSON.parse(result.body).path).toBe("/graphql");
    });

    it("should handle Function URL events via FunctionUrlTranslator", async () => {
        const handler = createLambdaHandler({
            root: container => {
                container.register(FunctionUrlEventType);
                container.register(FunctionUrlTranslator);
                container.register(fnUrlCaptureHandler);
            }
        });

        const result = await handler(fnUrlEvent);
        expect(JSON.parse(result.body).method).toBe("POST");
        expect(JSON.parse(result.body).path).toBe("/graphql");
    });
});
