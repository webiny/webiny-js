import {
    createHandler as createBaseHandler,
    CreateHandlerParams as BaseCreateHandlerParams
} from "@webiny/handler";
const Reply = require("fastify/lib/reply");
import { SQSEvent, Context as LambdaContext } from "aws-lambda";
import { SQSEventHandler, SQSEventHandlerCallableParams } from "./plugins/SQSEventHandler";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";

import { createHandleResponse } from "~/response";
import { registerDefaultPlugins } from "~/plugins";

const url = "/webiny-sqs-event";

export interface HandlerCallable {
    (event: SQSEvent, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

export interface CreateHandlerParams extends BaseCreateHandlerParams {
    debug?: boolean;
}

export const createHandler = (params: CreateHandlerParams): HandlerCallable => {
    return (event, context) => {
        const app = createBaseHandler({
            plugins: params.plugins,
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

export * from "./plugins/SQSEventHandler";
