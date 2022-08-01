const lambdaName = "test-logs-lambda";
const forwardUrl = "http://localhost/testing";

process.env.AWS_LAMBDA_FUNCTION_NAME = lambdaName;
process.env.WEBINY_LOGS_FORWARD_URL = forwardUrl;

let mockResult: any = {
    url: null,
    opts: null
};
jest.mock("node-fetch", () => {
    return (url: string, opts: any) => {
        mockResult.url = url;
        mockResult.opts = opts;
    };
});

import createPlugin from "~/index";
import { HandlerResultPlugin } from "@webiny/api";

describe("logs plugin", () => {
    it("should send data to given url", async () => {
        const plugin = createPlugin();

        expect(plugin).toBeInstanceOf(HandlerResultPlugin);

        const context = {} as any;
        const output = {} as any;

        const result = await plugin.handle(context, output);

        expect(result).toEqual(undefined);

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
