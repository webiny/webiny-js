/**
 * This is the handler implementation for @webiny/handler/plugins/EventPlugin.
 * This is mostly meant for some custom lambda calls as we are sometimes invoking lambdas directly.
 *
 * We should try to have some kind of standardized event type implementation at some point.
 */
import type { APIGatewayProxyResult, Context as LambdaContext } from "@webiny/aws-sdk/types";
import {
    createHandler as createBaseHandler,
    CreateHandlerParams as BaseCreateHandlerParams
} from "@webiny/handler";
import { RawEventHandler } from "~/raw/plugins/RawEventHandler";
import { registerDefaultPlugins } from "~/plugins";
import { execute } from "~/execute";
import { createComposedHandler } from "~/utils/composedHandler";
import { Context, Request } from "@webiny/handler/types";

const Reply = require("fastify/lib/reply");

const url = "/webiny-raw-event";

export interface HandlerCallable<Payload, Response = APIGatewayProxyResult> {
    (payload: Payload, context: LambdaContext): Promise<Response>;
}

export type CreateHandlerParams = BaseCreateHandlerParams;

interface HandlerParams<Payload = any> {
    request: Request;
    context: Context;
    payload: Payload;
    lambdaContext: LambdaContext;
    reply: Record<string, any>;
    next: () => Promise<Payload>;
}

export const createHandler = <Payload = any, Response = APIGatewayProxyResult>(
    params: CreateHandlerParams
): HandlerCallable<Payload, Response> => {
    return (payload, context) => {
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
        const plugins = app.webiny.plugins
            .byType<RawEventHandler<Payload, any, Response>>(RawEventHandler.type)
            .filter(plugin => {
                /**
                 * Just in case check that the plugin contains canHandle method.
                 * If it does not, we assume it can handle any payload.
                 */
                if (typeof plugin.canHandle !== "function") {
                    return true;
                }
                return plugin.canHandle(payload);
            })
            .reverse();
        if (plugins.length === 0) {
            throw new Error(`To run @webiny/handler-aws/raw, you must have RawEventHandler set.`);
        }

        const handler = createComposedHandler<
            RawEventHandler<Payload, any, Response>,
            HandlerParams,
            Response
        >(plugins);

        app.post(url, async (request, reply) => {
            const params: Omit<HandlerParams, "next"> = {
                request,
                reply,
                context: app.webiny,
                payload,
                lambdaContext: context
            };
            const result = await handler(params as unknown as HandlerParams);

            if (result instanceof Reply) {
                return result;
            }

            app.__webiny_raw_result = result;
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
