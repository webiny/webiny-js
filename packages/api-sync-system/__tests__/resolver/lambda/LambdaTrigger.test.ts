import { LambdaTrigger } from "~/resolver/lambda/LambdaTrigger.js";

describe("LambdaTrigger", () => {
    const arn = "arn:aws:lambda:us-east-1:123456789012:function:my-function";

    it("should invoke a Lambda function with the correct parameters", async () => {
        const trigger = new LambdaTrigger({
            arn,
            createLambdaClient: () => ({
                send: async cmd => {
                    return {
                        StatusCode: 200,
                        Payload: JSON.stringify(cmd.input)
                    };
                }
            })
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
        const trigger = new LambdaTrigger({
            arn,
            createLambdaClient: () => ({
                send: async () => {
                    throw new Error("Lambda invocation failed");
                }
            })
        });

        await expect(
            trigger.handle({
                payload: {
                    key: "value"
                },
                invocationType: "RequestResponse"
            })
        ).rejects.toThrow("Lambda invocation failed");
    });
});
