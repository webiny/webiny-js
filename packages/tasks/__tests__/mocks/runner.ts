import { ITaskRunner } from "~/runner/types";
import { ITaskEvent } from "~/handler/types";
import { Context as LambdaContext } from "aws-lambda/handler";
import { Reply, Request } from "@webiny/handler/types";
import { createMockContext } from "~tests/mocks/context";

export const createMockRunner = (params?: Partial<ITaskRunner>): ITaskRunner => {
    const { request, reply, context, event, lambdaContext, isTimeoutClose } = params || {};
    return {
        context: context || createMockContext(),
        isTimeoutClose: () => {
            if (isTimeoutClose) {
                return isTimeoutClose();
            }
            return false;
        },
        event: event || ({} as ITaskEvent),
        lambdaContext: lambdaContext || ({} as LambdaContext),
        reply: reply || ({} as Reply),
        request: request || ({} as Request)
    };
};
