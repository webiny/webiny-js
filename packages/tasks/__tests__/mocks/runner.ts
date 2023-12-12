import { ITaskRunner } from "~/runner/abstractions";
import { ITaskEvent } from "~/handler/types";
import { Context as LambdaContext } from "aws-lambda/handler";
import { Reply, Request } from "@webiny/handler/types";
import { createMockContext } from "~tests/mocks/context";

export const createMockRunner = (params?: Partial<ITaskRunner>): ITaskRunner => {
    const { request, reply, context, event, lambdaContext, getRemainingTime, isCloseToTimeout } =
        params || {};
    return {
        context: context || createMockContext(),
        isCloseToTimeout: () => {
            if (isCloseToTimeout) {
                return isCloseToTimeout();
            }
            return false;
        },
        getRemainingTime: () => {
            if (getRemainingTime) {
                return getRemainingTime();
            }
            return 1000;
        },
        event: event || ({} as ITaskEvent),
        lambdaContext: lambdaContext || ({} as LambdaContext),
        reply: reply || ({} as Reply),
        request: request || ({} as Request)
    };
};
