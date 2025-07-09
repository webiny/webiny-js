import {
    createLambdaClient,
    InvokeCommand,
    InvokeCommandInput,
    LambdaClient
} from "@webiny/aws-sdk/client-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { LambdaTrigger } from "~/resolver/lambda/LambdaTrigger.js";

describe("LambdaTrigger", () => {
    const arn = "arn:aws:lambda:us-east-1:123456789012:function:my-function";

    it("should invoke a Lambda function with the correct parameters", async () => {
        const mockedClient = mockClient(LambdaClient);
        mockedClient.on(InvokeCommand).callsFake((input: InvokeCommandInput) => {
            return {
                StatusCode: 200,
                Payload: JSON.stringify(input)
            };
        });

        const trigger = new LambdaTrigger({
            arn,
            createLambdaClient
        });

        const result = await trigger.handle({
            payload: {
                key: "value"
            },
            invocationType: "Event"
        });

        expect(result).toEqual({
            StatusCode: 200,
            Payload: JSON.stringify({
                FunctionName: arn,
                InvocationType: "Event",
                Payload: Buffer.from(
                    JSON.stringify({
                        key: "value"
                    })
                )
            })
        });
    });

    it("should trigger lambda and throw an error on failure", async () => {
        const mockedClient = mockClient(LambdaClient);
        mockedClient.on(InvokeCommand).rejects("Lambda invocation failed.");

        const trigger = new LambdaTrigger({
            arn,
            createLambdaClient
        });

        await expect(
            trigger.handle({
                payload: {
                    key: "value"
                },
                invocationType: "RequestResponse"
            })
        ).rejects.toThrow("Lambda invocation failed.");
    });
});
