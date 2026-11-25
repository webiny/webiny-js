import { describe, expect, it } from "vitest";
import type { Context } from "@webiny/aws-sdk/types/index.js";
import { createLambdaHandler } from "~/createLambdaHandler.js";
import { HttpFeature } from "@webiny/api-kernel-core";
import { HttpRouteHandler } from "@webiny/api-kernel-core";
import { KernelExecution } from "@webiny/api-kernel-core";
import { createHttpRouteDefinition } from "@webiny/api-kernel-core";
import type { IHttpResponse } from "@webiny/api-kernel-core";
import { ApiGatewayInputType, ApiGatewayHttpRouterHandler, type APIGatewayEvent } from "~/index.js";

const event = {
    httpMethod: "GET",
    path: "/execution-id",
    headers: {},
    requestContext: { requestId: "api-gateway-id" } as any,
    body: null,
    isBase64Encoded: false
} as APIGatewayEvent;

class ExecutionIdRoute implements HttpRouteHandler.Interface {
    constructor(private kernelExecution: KernelExecution.Interface) {}

    async handle(): Promise<IHttpResponse> {
        return { statusCode: 200, body: { executionId: this.kernelExecution.getId() } };
    }
}

const createHandler = () => {
    return createLambdaHandler({
        root: container => {
            container.register(ApiGatewayInputType);
            HttpFeature.register(container);
            container.register(ApiGatewayHttpRouterHandler);
            container.register(
                createHttpRouteDefinition({
                    name: "execution-id",
                    method: "GET",
                    path: "/execution-id",
                    handler: HttpRouteHandler.createImplementation({
                        implementation: ExecutionIdRoute,
                        dependencies: [KernelExecution]
                    })
                })
            );
        }
    });
};

const readExecutionId = (body: string | undefined): string => {
    return JSON.parse(body || "{}").executionId;
};

describe("Kernel execution id on Lambda", () => {
    it("should use the Lambda invocation's own id", async () => {
        const context = { awsRequestId: "aws-request-id" } as Context;

        const result = await createHandler()(event, context);

        expect(readExecutionId(result.body)).toBe("aws-request-id");
    });

    it("should fall back to a generated id per request", async () => {
        const handler = createHandler();

        const firstResult = await handler(event);
        const secondResult = await handler(event);
        const first = readExecutionId(firstResult.body);
        const second = readExecutionId(secondResult.body);

        expect(first).toMatch(/^[0-9a-f-]{36}$/);
        expect(second).toMatch(/^[0-9a-f-]{36}$/);
        expect(first).not.toBe(second);
    });
});
