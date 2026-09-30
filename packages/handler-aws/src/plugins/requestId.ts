import { createHandlerOnRequest, RequestId } from "@webiny/handler";
import type { Context } from "@webiny/handler/types.js";

interface RequestWithLambdaContext {
    awsLambda?: {
        context?: {
            awsRequestId?: string;
        };
    };
}

/**
 * Replaces the generated request id with the Lambda invocation's own, so a value reported to a
 * client can be matched against CloudWatch and X-Ray.
 *
 * Registered as a `HandlerOnRequestPlugin` rather than from the handler factory closure: the default
 * is registered per request inside `preHandler`, and `registerInstance` appends while `resolve`
 * returns the last registration. Registering earlier would mean the generated value always won.
 */
export const createRequestIdPlugin = () => {
    return createHandlerOnRequest<Context>(async (request, _reply, context) => {
        const awsRequestId = (request as unknown as RequestWithLambdaContext).awsLambda?.context
            ?.awsRequestId;
        /**
         * Nothing to do without one: `@webiny/handler` has already registered a generated default
         * earlier in the same `preHandler` hook, so the abstraction still resolves.
         */
        if (!awsRequestId) {
            return;
        }

        context.container.registerInstance(RequestId, { value: awsRequestId });
    });
};
