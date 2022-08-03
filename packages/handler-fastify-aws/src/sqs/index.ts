import {
    createFastify,
    CreateFastifyHandlerParams as BaseCreateFastifyHandlerParams
} from "@webiny/fastify";
import { SQSEvent, Context as LambdaContext } from "aws-lambda";
import { SQSEventHandler, SQSEventHandlerCallableParams } from "./plugins/SQSEventHandler";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";

import { createHandleResponse } from "~/response";

const url = "/webiny-sqs-event";

export interface HandlerCallable {
    (event: SQSEvent, context: LambdaContext): Promise<APIGatewayProxyResult>;
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
        const plugins = app.webiny.plugins.byType<SQSEventHandler>(SQSEventHandler.type);
        const handler = plugins.shift();
        if (!handler) {
            throw new Error(
                `To run @webiny/handler-fastify-aws/sqs, you must have SQSEventHandler set.`
            );
        }

        app.post(url, async (request, reply) => {
            const params: SQSEventHandlerCallableParams = {
                request,
                reply,
                context: app.webiny,
                event,
                lambdaContext: context
            };
            return await handler.cb(params);
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
                createHandleResponse(resolve, reject)
            );
        });
    };
};

export * from "./plugins/SQSEventHandler";
