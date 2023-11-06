const lambdaName = "test-logs-lambda";
const forwardUrl = "http://localhost/testing";

process.env.AWS_LAMBDA_FUNCTION_NAME = lambdaName;
process.env.WEBINY_LOGS_FORWARD_URL = forwardUrl;

const mockResult: any = {
    url: null,
    opts: null
};
jest.mock("node-fetch", () => {
    return (url: string, opts: any) => {
        mockResult.url = url;
        mockResult.opts = opts;
    };
});

import { createHandler, RoutePlugin } from "@webiny/handler-aws/gateway";
import { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import createHttpLogsHandlerResultPlugin from "~/index";

const testHandler = createHandler({
    plugins: [
        createHttpLogsHandlerResultPlugin(),
        new RoutePlugin(context => {
            context.onGet("/test", () => {
                console.log(forwardUrl);
                return null;
            });
        })
    ]
});

describe("logs plugin", () => {
    it("should send data to given url", async () => {
        await testHandler(
            {
                path: "/test"
            } as APIGatewayEvent,
            {} as LambdaContext
        );

        expect(mockResult.url).toEqual(forwardUrl);
        expect(mockResult.opts).toEqual({
            body: JSON.stringify([
                {
                    args: [forwardUrl],
                    meta: {
                        functionName: lambdaName
                    }
                }
            ]),
            headers: {
                "Bypass-Tunnel-Reminder": "1",
                "Content-Type": "application/json"
            },
            method: "POST"
        });
    });
});
