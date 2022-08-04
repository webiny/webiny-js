import { Context } from "aws-lambda";

export const createLambdaContext = (): Context => {
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
            return 100;
        },
        done: () => {
            return null;
        },
        fail: () => {
            return null;
        },
        succeed: () => {
            return null;
        }
    };
};
