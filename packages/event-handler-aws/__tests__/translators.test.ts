import { describe, it, expect } from "vitest";
import { createLambdaHandler } from "~/createLambdaHandler.js";
import { ApiGatewayEventType } from "~/index.js";
import { ApiGatewayHttpRouterHandler } from "~/handlers/ApiGatewayHttpRouterHandler.js";
import { HttpFeature } from "@webiny/event-handler-core";
import { HttpRoute } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import { createHttpRoute, registerHttpRoute } from "@webiny/event-handler-core";

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

describe("ApiGatewayHttpRouterHandler", () => {
    const makeRoute = (statusCode: number, body: any) => {
        class MakeRouteImplementation implements HttpRoute.Interface {
            async handle(_req: IHttpRequest): Promise<IHttpResponse> {
                return { statusCode, body };
            }
        }
        return createHttpRoute({
            name: "test:MakeRoute",
            method: "POST",
            path: "/graphql",
            implementation: MakeRouteImplementation,
            dependencies: []
        });
    };

    it("should translate APIGatewayProxyEvent, route, and translate back", async () => {
        const handler = createLambdaHandler({
            root: container => {
                container.register(ApiGatewayEventType);
                HttpFeature.register(container);
                registerHttpRoute(container, makeRoute(200, { ok: true }));
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
        class BufferRouteImplementation implements HttpRoute.Interface {
            async handle(_req: IHttpRequest): Promise<IHttpResponse> {
                return {
                    statusCode: 200,
                    headers: { "content-type": "image/png" },
                    body: Buffer.from("PNG")
                };
            }
        }
        const bufferRoute = createHttpRoute({
            name: "test:BufferRoute",
            method: "POST",
            path: "/graphql",
            implementation: BufferRouteImplementation,
            dependencies: []
        });

        const handler = createLambdaHandler({
            root: container => {
                container.register(ApiGatewayEventType);
                HttpFeature.register(container);
                registerHttpRoute(container, bufferRoute);
                container.register(ApiGatewayHttpRouterHandler);
            }
        });

        const result = await handler(apiGwEvent);
        expect(result.isBase64Encoded).toBe(true);
        expect(result.body).toBe(Buffer.from("PNG").toString("base64"));
    });
});
