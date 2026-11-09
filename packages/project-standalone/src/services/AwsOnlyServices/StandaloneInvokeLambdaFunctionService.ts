import { InvokeLambdaFunction } from "@webiny/project/abstractions/aws/index.js";
import { createAwsOnlyError } from "./createAwsOnlyError.js";

class StandaloneInvokeLambdaFunction implements InvokeLambdaFunction.Interface {
    async execute(): Promise<never> {
        throw createAwsOnlyError("InvokeLambdaFunction");
    }
}

export const StandaloneInvokeLambdaFunctionService = InvokeLambdaFunction.createImplementation({
    implementation: StandaloneInvokeLambdaFunction,
    dependencies: []
});
