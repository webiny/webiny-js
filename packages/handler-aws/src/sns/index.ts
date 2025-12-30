import type {
    APIGatewayProxyResult,
    SNSEvent,
    Context as LambdaContext
} from "@webiny/aws-sdk/types/index.js";
import { createHandler as createBaseHandler } from "@webiny/handler";
import { registerDefaultPlugins } from "~/plugins/index.js";
import type { SNSEventHandlerCallableParams } from "./plugins/SNSEventHandler.js";
import { SNSEventHandler } from "./plugins/SNSEventHandler.js";
import { execute } from "~/execute.js";
import type { HandlerFactoryParams } from "~/types.js";
/**
 * We need a class, not an interface exported from types.
 */
// @ts-expect-error
import Reply from "fastify/lib/reply.js";
import { createComposedHandler } from "~/utils/composedHandler.js";

export * from "./plugins/SNSEventHandler.js";

export interface HandlerCallable {
    (event: SNSEvent, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

export type HandlerParams = HandlerFactoryParams;

const url = "/webiny-sns-event";

export const createHandler = (params: HandlerParams): HandlerCallable => {
    return async (event, context) => {
        const app = createBaseHandler({
            ...params,
            options: {
                logger: params.debug === true,
                ...(params.options || {})
            }
        });
        /**
         * We always must add our default plugins to the app.
         */
        registerDefaultPlugins(app.webiny);
        /**
         * There must be an event plugin for this handler to work.
         */
        const plugins = app.webiny.plugins.byType<SNSEventHandler>(SNSEventHandler.type).reverse();
        if (plugins.length === 0) {
            throw new Error(`To run @webiny/handler-aws/sns, you must have SNSEventHandler set.`);
        }

        const handler = createComposedHandler<
            SNSEventHandler,
            SNSEventHandlerCallableParams<APIGatewayProxyResult>,
            APIGatewayProxyResult
        >(plugins);

        app.post(url, async (request, reply) => {
            const params: Omit<SNSEventHandlerCallableParams<APIGatewayProxyResult>, "next"> = {
                request,
                reply,
                context: app.webiny,
                event,
                lambdaContext: context
            };

            const result = await handler(
                params as unknown as SNSEventHandlerCallableParams<APIGatewayProxyResult>
            );

            if (result instanceof Reply) {
                return result;
            }

            app.__WBY_raw_result = result;
            return reply.send({});
        });
        return execute({
            app,
            url,
            payload: event
        });
    };
};
