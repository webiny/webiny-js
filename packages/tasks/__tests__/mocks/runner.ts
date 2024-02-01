import { ITaskRunner } from "~/runner/abstractions";
import { Context as LambdaContext } from "aws-lambda/handler";
import { createMockContext } from "~tests/mocks/context";
import { IResponseResult } from "~/response/abstractions";

export const createMockRunner = (params?: Partial<ITaskRunner>): ITaskRunner => {
    const { context, lambdaContext, getRemainingTime, isCloseToTimeout } = params || {};
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
        run: async () => {
            return {} as IResponseResult;
        }
    };
};
