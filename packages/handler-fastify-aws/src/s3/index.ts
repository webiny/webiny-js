import {
    createFastify,
    CreateFastifyHandlerParams as BaseCreateFastifyHandlerParams
} from "@webiny/fastify";
const Reply = require("fastify/lib/Reply");
import { S3Event, Context as LambdaContext } from "aws-lambda";
import { S3EventHandler, S3EventHandlerCallableParams } from "./plugins/S3EventHandler";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { createHandleResponse } from "~/response";

const url = "/webiny-s3-event";

export interface HandlerCallable {
    (event: S3Event, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

export interface CreateHandlerParams extends BaseCreateFastifyHandlerParams {
    debug?: boolean;
}

export const createHandler = (params: CreateHandlerParams): HandlerCallable => {
    return (event, context) => {
        const app = createFastify({
            plugins: params.plugins,
            options: {
                logger: params.debug === true,
                ...(params.options || {})
            }
        });
        /**
         * There must be an event plugin for this handler to work.
         */
        const plugins = app.webiny.plugins.byType<S3EventHandler>(S3EventHandler.type);
        const handler = plugins.shift();
        if (!handler) {
            throw new Error(
                `To run @webiny/handler-fastify-aws/s3, you must have S3EventHandler set.`
            );
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

            (app as any).__webiny_raw_result = result;
            return reply.send({});
        });
        return new Promise((resolve, reject) => {
            app.inject(
                {
                    method: "POST",
                    url,
                    payload: event || {},
                    query: {},
                    headers: {}
                },
                createHandleResponse(app, resolve, reject)
            );
        });
    };
};

export * from "./plugins/S3EventHandler";
