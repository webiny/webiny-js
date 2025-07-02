import type { LambdaClient } from "@webiny/aws-sdk/client-lambda";

export const createMockLambdaClient = (fn?: CallableFunction): Pick<LambdaClient, "send"> => {
    return {
        send: input => {
            return fn ? fn(input) : () => {};
        }
    };
};
