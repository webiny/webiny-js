import { createHandler as createBaseHandler } from "@webiny/handler";
import { registerDefaultPlugins } from "~/plugins";
import { S3EventHandler, S3EventHandlerCallableParams } from "~/s3/plugins/S3EventHandler";
import { execute } from "~/execute";
import { HandlerFactoryParams } from "~/types";
/**
 * We need a class, not an interface exported from types.
 */
// @ts-expect-error
import Reply from "fastify/lib/reply";
import { APIGatewayProxyResult, S3Event } from "aws-lambda";
import { Context as LambdaContext } from "aws-lambda/handler";

export * from "./plugins/S3EventHandler";

export interface HandlerCallable {
    (event: S3Event, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

export interface HandlerParams extends HandlerFactoryParams {
    debug?: boolean;
}

const url = "/webiny-s3-event";

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
        const plugins = app.webiny.plugins.byType<S3EventHandler>(S3EventHandler.type);
        const handler = plugins.shift();
        if (!handler) {
            throw new Error(`To run @webiny/handler-aws/s3, you must have S3EventHandler set.`);
        }

        app.post(url, async (request, reply) => {
            const params: S3EventHandlerCallableParams = {
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
