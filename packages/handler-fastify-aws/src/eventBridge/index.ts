import {
    createFastify,
    CreateFastifyHandlerParams as BaseCreateFastifyHandlerParams
} from "@webiny/fastify";
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

export interface CreateHandlerParams extends BaseCreateFastifyHandlerParams {
    debug?: boolean;
}

export const createHandler = <DetailType extends string, Detail>(
    params: CreateHandlerParams
): HandlerCallable<DetailType, Detail> => {
    return (payload, context) => {
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
            return await handler.cb(params);
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
                createHandleResponse(resolve, reject)
            );
        });
    };
};

export * from "./plugins/EventBridgeEventHandler";
