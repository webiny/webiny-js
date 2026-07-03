import type { Context } from "@webiny/aws-sdk/types/index.js";
import type { IAwsLambdaContext } from "./AwsLambdaContext.js";

/**
 * An empty AWS Lambda context: every field defaulted and every callback a no-op. Returned by the
 * null object so consumers get a usable Context shape (never `null`) when there is no real context.
 */
const createEmptyContext = (): Context => ({
    callbackWaitsForEmptyEventLoop: false,
    functionName: "",
    functionVersion: "",
    invokedFunctionArn: "",
    memoryLimitInMB: "",
    awsRequestId: "",
    logGroupName: "",
    logStreamName: "",
    getRemainingTimeInMillis: () => 0,
    done: () => {},
    fail: () => {},
    succeed: () => {}
});

/**
 * Null Object for {@link AwsLambdaContext}: represents an invocation with no Lambda context
 * (e.g. an event dispatched without one). The AWS transport always registers an AwsLambdaContext —
 * this null object when none is present — so consumers can resolve it unconditionally and branch
 * on `isSet()`. `get()` returns an empty placeholder context, never `null`.
 */
export class NullAwsLambdaContext implements IAwsLambdaContext {
    private readonly context: Context = createEmptyContext();

    isSet(): boolean {
        return false;
    }

    get(): Context {
        return this.context;
    }
}
