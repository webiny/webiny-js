import { describe, it, expect } from "vitest";
import { createLambdaHandler } from "~/createLambdaHandler.js";
import { ApiGatewayEventType } from "~/index.js";
import { ApiGatewayHttpRouterHandler } from "~/handlers/ApiGatewayHttpRouterHandler.js";
import { HttpFeature } from "@webiny/event-handler-core";
import { HttpRoute } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import { HttpRouteDefinition, HttpRouteHandler } from "@webiny/event-handler-core";

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
        const implementation = HttpRouteHandler.createImplementation({
            implementation: MakeRouteImplementation,
            dependencies: []
        });

        return {
            implementation,
            definition: {
                method: "POST",
                path: "/graphql",
                handler: implementation
            } as HttpRouteDefinition.Interface
        };
    };

    it("should translate APIGatewayProxyEvent, route, and translate back", async () => {
        const handler = createLambdaHandler({
            root: container => {
                container.register(ApiGatewayEventType);
                HttpFeature.register(container);
                const route = makeRoute(200, { ok: true });
                container.registerInstance(HttpRouteDefinition, route.definition);
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
        const bufferImplementation = HttpRouteHandler.createImplementation({
            implementation: BufferRouteImplementation,
            dependencies: []
        });
        const bufferRoute = {
            implementation: bufferImplementation,
            definition: {
                method: "POST",
                path: "/graphql",
                handler: bufferImplementation
            } as HttpRouteDefinition.Interface
        };

        const handler = createLambdaHandler({
            root: container => {
                container.register(ApiGatewayEventType);
                HttpFeature.register(container);
                container.registerInstance(HttpRouteDefinition, bufferRoute.definition);
                container.register(ApiGatewayHttpRouterHandler);
            }
        });

        const result = await handler(apiGwEvent);
        expect(result.isBase64Encoded).toBe(true);
        expect(result.body).toBe(Buffer.from("PNG").toString("base64"));
    });
});
