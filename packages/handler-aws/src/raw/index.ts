/**
 * This is the handler implementation for @webiny/handler/plugins/EventPlugin.
 * This is mostly meant for some custom lambda calls as we are sometimes invoking lambdas directly.
 *
 * We should try to have some kind of standardized event type implementation at some point.
 */
import {
    createHandler as createBaseHandler,
    CreateHandlerParams as BaseCreateHandlerParams
} from "@webiny/handler";
const Reply = require("fastify/lib/reply");
import { Context as LambdaContext } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { RawEventHandler } from "~/raw/plugins/RawEventHandler";
import { registerDefaultPlugins } from "~/plugins";
import { execute } from "~/execute";

const url = "/webiny-raw-event";

export interface HandlerCallable<Payload, Response = APIGatewayProxyResult> {
    (payload: Payload, context: LambdaContext): Promise<Response>;
}

export interface CreateHandlerParams extends BaseCreateHandlerParams {
    http?: {
        debug?: boolean;
    };
}

export const createHandler = <Payload = any, Response = APIGatewayProxyResult>(
    params: CreateHandlerParams
): HandlerCallable<Payload, Response> => {
    return (payload, context) => {
        const app = createBaseHandler({
            ...params,
            options: {
                logger: params.http?.debug === true,
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
        const plugins = app.webiny.plugins.byType<RawEventHandler<Payload, any, Response>>(
            RawEventHandler.type
        );
        const handler = plugins.shift();
        if (!handler) {
            throw new Error(`To run @webiny/handler-aws/raw, you must have RawEventHandler set.`);
        }

        app.post(url, async (request, reply) => {
            const params = {
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
        return execute({
            app,
            url,
            payload
        });
    };
};

export * from "./plugins/RawEventHandler";
