import {
    createHandler as createBaseHandler,
    CreateHandlerParams as BaseCreateHandlerParams
} from "@webiny/fastify";
const Reply = require("fastify/lib/reply");
import { EventBridgeEvent, Context as LambdaContext } from "aws-lambda";
import {
    EventBridgeEventHandler,
    EventBridgeEventHandlerCallableParams
} from "./plugins/EventBridgeEventHandler";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";

import { createHandleResponse } from "~/response";

const url = "/webiny-sqs-event";

export interface HandlerCallable<DetailType extends string, Detail> {
    (
        event: EventBridgeEvent<DetailType, Detail>,
        context: LambdaContext
    ): Promise<APIGatewayProxyResult>;
}

export interface CreateHandlerParams extends BaseCreateHandlerParams {
    debug?: boolean;
}

export const createHandler = <DetailType extends string, Detail>(
    params: CreateHandlerParams
): HandlerCallable<DetailType, Detail> => {
    return (payload, context) => {
        const app = createBaseHandler({
            plugins: params.plugins,
            options: {
                logger: params.debug === true,
                ...(params.options || {})
            }
        });
        /**
         * There must be an event plugin for this handler to work.
         */
        const plugins = app.webiny.plugins.byType<EventBridgeEventHandler<DetailType, Detail>>(
            EventBridgeEventHandler.type
        );
        const handler = plugins.shift();
        if (!handler) {
            throw new Error(
                `To run @webiny/handler-fastify-aws/eventBridge, you must have EventBridgeEventHandler set.`
            );
        }

        app.post(url, async (request, reply) => {
            const params: EventBridgeEventHandlerCallableParams<DetailType, Detail> = {
                request,
                reply,
                context: app.webiny,
                payload,
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
                    payload: payload || {},
                    query: {},
                    headers: {}
                },
                createHandleResponse(app, resolve, reject)
            );
        });
    };
};

export * from "./plugins/EventBridgeEventHandler";
