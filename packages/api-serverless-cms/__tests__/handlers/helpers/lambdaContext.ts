import { LambdaContext } from "@webiny/handler-aws/types";

export const createLambdaContext = (input?: Partial<LambdaContext>): LambdaContext => {
    return {
        awsRequestId: "abc",
        callbackWaitsForEmptyEventLoop: false,
        functionName: "handler",
        functionVersion: "1",
        invokedFunctionArn: "xyz",
        memoryLimitInMB: "512",
        logGroupName: "custom",
        logStreamName: "custom",
        getRemainingTimeInMillis: () => {
            return 15 * 60 * 60;
        },
        done: () => {
            return null;
        },
        fail: () => {
            return null;
        },
        succeed: () => {
            return null;
        },
        ...input
    };
};
