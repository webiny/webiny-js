import { createHandler as createBaseHandler } from "@webiny/handler";
import { registerDefaultPlugins } from "~/plugins";
import { SQSEventHandler, SQSEventHandlerCallableParams } from "~/sqs/plugins/SQSEventHandler";
import { execute } from "~/execute";
import { HandlerFactoryParams } from "~/types";
import { APIGatewayProxyResult, SQSEvent } from "aws-lambda";
import { Context as LambdaContext } from "aws-lambda/handler";
/**
 * We need a class, not an interface exported from types.
 */
// @ts-expect-error
import Reply from "fastify/lib/reply";

export * from "./plugins/SQSEventHandler";

export interface HandlerCallable {
    (event: SQSEvent, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

export interface HandlerParams extends HandlerFactoryParams {
    debug?: boolean;
}

const url = "/webiny-sqs-event";

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
        const plugins = app.webiny.plugins.byType<SQSEventHandler>(SQSEventHandler.type);
        const handler = plugins.shift();
        if (!handler) {
            throw new Error(`To run @webiny/handler-aws/sqs, you must have SQSEventHandler set.`);
        }

        app.post(url, async (request, reply) => {
            const params: SQSEventHandlerCallableParams = {
                request,
                reply,
                context: app.webiny,
                event,
                lambdaContext: context
            };
            const result = await handler.cb(params);

            if (result instanceof Reply) {
                return result;
            }

            app.__webiny_raw_result = result;
            return reply.send({});
        });
        return execute({
            app,
            url,
            payload: event
        });
    };
};
