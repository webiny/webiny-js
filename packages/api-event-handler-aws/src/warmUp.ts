/**
 * Init-time warm-up for the API Gateway handler.
 *
 * Lambda runs a function's init phase with close to a full vCPU, then caps each invocation at the
 * share that comes with the configured memory (about 0.58 vCPU at 1024 MB). Measured on a 1024 MB
 * function, the first request of a cold start was CPU-bound and ran at roughly 0.57 CPU seconds per
 * second. So the work a first request does (building the root and request containers, loading the
 * license, opening the DynamoDB connection, building the GraphQL schema, compiling the code on that
 * path) costs about 1.7x more there than it does during init.
 *
 * `warmUp()` sends one internal `{ __typename }` request through the full stack while the function
 * initializes, so a real first request finds all of that already done.
 */
import type { Context } from "@webiny/aws-sdk/types/index.js";

export type LambdaHandler = (event: any, context?: Context) => Promise<any>;

export type WarmableLambdaHandler = LambdaHandler & {
    warmUp(): Promise<void>;
};

// Init has a 10 second limit. If the warm-up hangs (an unreachable database, say), init carries on
// without it and the first request does the remaining work, as it would without a warm-up.
const WARM_UP_TIMEOUT_MS = 5000;

const createWarmUpEvent = () => {
    return {
        resource: "/graphql",
        path: "/graphql",
        httpMethod: "POST",
        headers: { "content-type": "application/json" },
        multiValueHeaders: { "content-type": ["application/json"] },
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: {
            resourcePath: "/graphql",
            httpMethod: "POST",
            path: "/graphql",
            stage: "$default",
            requestId: "webiny-warm-up",
            identity: { sourceIp: "127.0.0.1" }
        },
        body: JSON.stringify({ query: "{ __typename }" }),
        isBase64Encoded: false
    };
};

const createWarmUpContext = () => {
    return {
        awsRequestId: "webiny-warm-up",
        callbackWaitsForEmptyEventLoop: false,
        getRemainingTimeInMillis: () => WARM_UP_TIMEOUT_MS
    } as unknown as Context;
};

const warmUpHandler = async (handler: LambdaHandler): Promise<void> => {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<void>(resolve => {
        timer = setTimeout(resolve, WARM_UP_TIMEOUT_MS);
        timer.unref();
    });

    const event = createWarmUpEvent();
    const context = createWarmUpContext();
    const request = handler(event, context).then(
        () => undefined,
        // A failed warm-up must never fail init. A fresh install, for example, has no tenant yet.
        // The first real request goes through the same code and reports the error properly.
        () => undefined
    );

    try {
        await Promise.race([request, timeout]);
    } finally {
        clearTimeout(timer);
    }
};

export const withWarmUp = (handler: LambdaHandler): WarmableLambdaHandler => {
    return Object.assign(handler, {
        warmUp: () => warmUpHandler(handler)
    });
};

const isWarmable = (handler: unknown): handler is WarmableLambdaHandler => {
    return typeof handler === "function" && "warmUp" in handler;
};

/**
 * One bundle exports several handlers (`handler`, `streamHandler`) and each is deployed as its own
 * Lambda function. Lambda sets `_HANDLER` to the entry it runs ("handler.handler"), so only that
 * function's handler is warmed up, and only if it supports it.
 */
export const warmUpLambdaHandler = async (handlers: Record<string, unknown>): Promise<void> => {
    const entry = process.env._HANDLER;
    if (!entry) {
        return;
    }

    const exportName = entry.split(".").pop() as string;
    const handler = handlers[exportName];
    if (!isWarmable(handler)) {
        return;
    }

    await handler.warmUp();
};
