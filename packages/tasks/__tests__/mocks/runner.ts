import { ITaskRunner } from "~/runner/abstractions";
import { Context as LambdaContext } from "aws-lambda/handler";
import { Reply, Request } from "@webiny/handler/types";
import { createMockContext } from "~tests/mocks/context";
import { IResponseResult } from "~/response/abstractions";

export const createMockRunner = (params?: Partial<ITaskRunner>): ITaskRunner => {
    const { request, reply, context, lambdaContext, getRemainingTime, isCloseToTimeout } =
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
        lambdaContext: lambdaContext || ({} as LambdaContext),
        reply: reply || ({} as Reply),
        request: request || ({} as Request),
        run: async () => {
            return {} as IResponseResult;
        }
    };
};
