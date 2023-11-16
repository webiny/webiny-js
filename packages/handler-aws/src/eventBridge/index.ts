import { createHandler as createBaseHandler } from "@webiny/handler";
import { registerDefaultPlugins } from "~/plugins";
import {
    EventBridgeEventHandler,
    EventBridgeEventHandlerCallableParams
} from "~/eventBridge/plugins/EventBridgeEventHandler";
import { execute } from "~/execute";
import { HandlerFactoryParams } from "~/types";
import { APIGatewayProxyResult, Context as LambdaContext, EventBridgeEvent } from "aws-lambda";
/**
 * We need a class, not an interface exported from types.
 */
// @ts-expect-error
import Reply from "fastify/lib/reply";

export * from "./plugins/EventBridgeEventHandler";

export interface HandlerParams extends HandlerFactoryParams {
    debug?: boolean;
}

export interface HandlerCallable {
    (
        event: EventBridgeEvent<string, string>,
        context: LambdaContext
    ): Promise<APIGatewayProxyResult>;
}

const url = "/webiny-eventBridge-event";

export const createHandler = (params: HandlerParams): HandlerCallable => {
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
        const plugins = app.webiny.plugins.byType<EventBridgeEventHandler<string, string>>(
            EventBridgeEventHandler.type
        );
        const handler = plugins.shift();
        if (!handler) {
            throw new Error(
                `To run @webiny/handler-aws/eventBridge, you must have EventBridgeEventHandler set.`
            );
        }

        app.post(url, async (request, reply) => {
            const params: EventBridgeEventHandlerCallableParams<string, string> = {
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
