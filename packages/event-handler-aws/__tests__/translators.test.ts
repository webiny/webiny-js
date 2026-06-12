import { describe, it, expect } from "vitest";
import { createLambdaHandler } from "~/createLambdaHandler.js";
import { ApiGatewayEventType, FunctionUrlEventType, FunctionUrlTranslator } from "~/index.js";
import { ApiGatewayEventHandler } from "~/abstractions/handlers/ApiGatewayEventHandler.js";
import { ApiGatewayHttpRouterHandler } from "~/handlers/ApiGatewayHttpRouterHandler.js";
import { HttpFeature } from "@webiny/event-handler-core";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import { GraphQLEngineFeature } from "@webiny/handler-graphql";
import { HttpRoute } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import { EventHandler } from "@webiny/event-handler-core";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";

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

describe("ApiGatewayHttpRouterHandler", () => {
    const makeRoute = (statusCode: number, body: any) =>
        HttpRoute.createImplementation({
            implementation: class {
                readonly method = "POST";
                readonly path = "/graphql";
                async handle(_req: IHttpRequest): Promise<IHttpResponse> {
                    return { statusCode, body };
                }
            },
            dependencies: []
        });

    it("should translate APIGatewayProxyEvent, route, and translate back", async () => {
        const handler = createLambdaHandler({
            root: container => {
                container.register(ApiGatewayEventType);
                HttpFeature.register(container);
                container.register(makeRoute(200, { ok: true }));
                container.register(ApiGatewayHttpRouterHandler);
            }
        });

        const result = await handler(apiGwEvent);
        expect(result.statusCode).toBe(200);
        expect(result.body).toBe(JSON.stringify({ ok: true }));
    });

    it("should return 404 for unknown routes", async () => {
        const handler = createLambdaHandler({
            root: container => {
                container.register(ApiGatewayEventType);
                HttpFeature.register(container);
                container.register(ApiGatewayHttpRouterHandler);
            }
        });

        const result = await handler(apiGwEvent);
        expect(result.statusCode).toBe(404);
    });

    it("should set isBase64Encoded for Buffer responses", async () => {
        const bufferRoute = HttpRoute.createImplementation({
            implementation: class {
                readonly method = "POST";
                readonly path = "/graphql";
                async handle(_req: IHttpRequest): Promise<IHttpResponse> {
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
                HttpFeature.register(container);
                container.register(bufferRoute);
                container.register(ApiGatewayHttpRouterHandler);
            }
        });

        const result = await handler(apiGwEvent);
        expect(result.isBase64Encoded).toBe(true);
        expect(result.body).toBe(Buffer.from("PNG").toString("base64"));
    });
});

describe("FunctionUrlTranslator", () => {
    it("should translate LambdaFunctionURLEvent to IHttpRequest", async () => {
        const fnUrlCaptureHandler = EventHandler.createImplementation({
            implementation: class {
                async execute(ctx: EventContext, _next: NextFunction) {
                    return { statusCode: 200, body: ctx.event };
                }
            },
            dependencies: []
        });

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
