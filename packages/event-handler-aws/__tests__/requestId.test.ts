import { describe, expect, it } from "vitest";
import type { Context } from "@webiny/aws-sdk/types/index.js";
import { createLambdaHandler } from "~/createLambdaHandler.js";
import { HttpFeature } from "@webiny/event-handler-core";
import { HttpRouteHandler } from "@webiny/event-handler-core";
import { RequestId } from "@webiny/event-handler-core";
import { createHttpRouteDefinition } from "@webiny/event-handler-core";
import type { IHttpResponse } from "@webiny/event-handler-core";
import { ApiGatewayEventType, ApiGatewayHttpRouterHandler, type APIGatewayEvent } from "~/index.js";

const event = {
    httpMethod: "GET",
    path: "/request-id",
    headers: {},
    requestContext: { requestId: "api-gateway-id" } as any,
    body: null,
    isBase64Encoded: false
} as APIGatewayEvent;

class RequestIdRoute implements HttpRouteHandler.Interface {
    constructor(private requestId: RequestId.Interface) {}

    async handle(): Promise<IHttpResponse> {
        return { statusCode: 200, body: { requestId: this.requestId.value } };
    }
}

const createHandler = () => {
    return createLambdaHandler({
        root: container => {
            container.register(ApiGatewayEventType);
            HttpFeature.register(container);
            container.register(ApiGatewayHttpRouterHandler);
            container.register(
                createHttpRouteDefinition({
                    name: "request-id",
                    method: "GET",
                    path: "/request-id",
                    handler: HttpRouteHandler.createImplementation({
                        implementation: RequestIdRoute,
                        dependencies: [RequestId]
                    })
                })
            );
        }
    });
};

const readRequestId = (body: string | undefined): string => {
    return JSON.parse(body || "{}").requestId;
};

describe("RequestId", () => {
    it("should use the Lambda invocation's own id", async () => {
        const context = { awsRequestId: "aws-request-id" } as Context;

        const result = await createHandler()(event, context);

        expect(readRequestId(result.body)).toBe("aws-request-id");
    });

    it("should fall back to a generated id per request", async () => {
        const handler = createHandler();

        const first = readRequestId((await handler(event)).body);
        const second = readRequestId((await handler(event)).body);

        expect(first).toMatch(/^[0-9a-f-]{36}$/);
        expect(second).toMatch(/^[0-9a-f-]{36}$/);
        expect(first).not.toBe(second);
    });
});
