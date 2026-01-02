import { LambdaClient, InvokeCommand } from "@webiny/aws-sdk/client-lambda/index.js";
import { GetAppStackOutput } from "@webiny/project/abstractions/index.js";
import { InvokeLambdaFunction as InvokeLambdaFunctionAbstraction } from "~/abstractions/InvokeLambdaFunction.js";
import { IDefaultStackOutput } from "~/pulumi/types.js";

export class InvokeLambdaFunctionImpl implements InvokeLambdaFunctionAbstraction.Interface {
    constructor(private getAppStackOutput: GetAppStackOutput.Interface) {}

    async execute<T = any>(
        params: InvokeLambdaFunctionAbstraction.Params
    ): Promise<InvokeLambdaFunctionAbstraction.Result<T>> {
        // Get region from stack output
        const stackOutput = await this.getAppStackOutput.execute<IDefaultStackOutput>("api");

        if (!stackOutput) {
            throw new Error("Could not retrieve API stack output for Lambda invocation.");
        }

        const { region } = stackOutput;
        const lambdaClient = new LambdaClient({ region });

        const response = await lambdaClient.send(
            new InvokeCommand({
                FunctionName: params.functionName,
                InvocationType: params.invocationType || "RequestResponse",
                Payload: JSON.stringify(params.payload)
            })
        );

        const decoder = new TextDecoder("utf-8");
        const payload = JSON.parse(decoder.decode(response.Payload));

        return {
            statusCode: response.StatusCode,
            payload
        };
    }
}

export const InvokeLambdaFunction = InvokeLambdaFunctionAbstraction.createImplementation({
    implementation: InvokeLambdaFunctionImpl,
    dependencies: [GetAppStackOutput]
});
