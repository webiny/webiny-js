/**
 * This is the handler implementation for @webiny/fastify/plugins/EventPlugin.
 * This is mostly meant for some custom lambda calls as we are sometimes invoking lambdas directly.
 *
 * We should try to have some kind of standardized event type implementation at some point.
 */
import {
    createFastify,
    CreateFastifyHandlerParams as BaseCreateFastifyHandlerParams,
    EventPlugin
} from "@webiny/fastify";
import { Context as LambdaContext } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";

import { createHandleResponse } from "~/response";

const url = "/webiny-raw-event";

export interface HandlerCallable<Payload> {
    (event: Payload, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

export interface CreateHandlerParams extends BaseCreateFastifyHandlerParams {
    debug?: boolean;
}

export const createHandler = <Payload = any>(
    params: CreateHandlerParams
): HandlerCallable<Payload> => {
    return event => {
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
        const plugins = app.webiny.plugins.byType<EventPlugin<Payload>>(EventPlugin.type);
        const handler = plugins.shift();
        if (!handler) {
            throw new Error(
                `To run @webiny/handler-fastify-aws/event, you must have EventPlugin set.`
            );
        }

        app.post(url, async (request, reply) => {
            const params = {
                request,
                reply,
                context: app.webiny,
                payload: event
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
