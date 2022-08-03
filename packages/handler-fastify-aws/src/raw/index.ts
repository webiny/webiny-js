/**
 * This is the handler implementation for @webiny/fastify/plugins/EventPlugin.
 * This is mostly meant for some custom lambda calls as we are sometimes invoking lambdas directly.
 *
 * We should try to have some kind of standardized event type implementation at some point.
 */
import {
    createFastify,
    CreateFastifyHandlerParams as BaseCreateFastifyHandlerParams
} from "@webiny/fastify";
const Reply = require("fastify/lib/reply");
import { Context as LambdaContext } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";

import { createHandleResponse } from "~/response";
import { RawEventHandler } from "~/raw/plugins/RawEventHandler";

const url = "/webiny-raw-event";

export interface HandlerCallable<Payload, Response = APIGatewayProxyResult> {
    (event: Payload, context: LambdaContext): Promise<Response>;
}

export interface CreateHandlerParams extends BaseCreateFastifyHandlerParams {
    http?: {
        debug?: boolean;
    };
}

export const createHandler = <Payload = any, Response = APIGatewayProxyResult>(
    params: CreateHandlerParams
): HandlerCallable<Payload, Response> => {
    return (event, context) => {
        const app = createFastify({
            plugins: params.plugins,
            options: {
                logger: params.http?.debug === true,
                ...(params.options || {})
            }
        });
        /**
         * There must be an event plugin for this handler to work.
         */
        const plugins = app.webiny.plugins.byType<RawEventHandler<Payload, any, Response>>(
            RawEventHandler.type
        );
        const handler = plugins.shift();
        if (!handler) {
            throw new Error(
                `To run @webiny/handler-fastify-aws/event, you must have RawEventHandler set.`
            );
        }

        app.post(url, async (request, reply) => {
            const params = {
                request,
                reply,
                context: app.webiny,
                payload: event,
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

export * from "./plugins/RawEventHandler";
