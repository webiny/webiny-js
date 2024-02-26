import { createHandler as createBaseHandler } from "@webiny/handler";
import { registerDefaultPlugins } from "~/plugins";
import {
    EventBridgeEventHandler,
    EventBridgeEventHandlerCallableParams
} from "~/eventBridge/plugins/EventBridgeEventHandler";
import { execute } from "~/execute";
import { HandlerFactoryParams } from "~/types";
import type { APIGatewayProxyResult, Context as LambdaContext, EventBridgeEvent } from "aws-lambda";
/**
 * We need a class, not an interface exported from types.
 */
// @ts-expect-error
import Reply from "fastify/lib/reply";
import { createComposedHandler } from "~/utils/composedHandler";

export * from "./plugins/EventBridgeEventHandler";

export type HandlerParams = HandlerFactoryParams;

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
        const plugins = app.webiny.plugins
            .byType<EventBridgeEventHandler<string, string>>(EventBridgeEventHandler.type)
            .reverse();
        if (plugins.length === 0) {
            throw new Error(
                `To run @webiny/handler-aws/eventBridge, you must have EventBridgeEventHandler set.`
            );
        }

        const handler = createComposedHandler<
            EventBridgeEventHandler<string, string>,
            EventBridgeEventHandlerCallableParams<string, string, APIGatewayProxyResult>,
            APIGatewayProxyResult
        >(plugins);

        app.post(url, async (request, reply) => {
            const params: Omit<
                EventBridgeEventHandlerCallableParams<string, string, APIGatewayProxyResult>,
                "next"
            > = {
                request,
                reply,
                context: app.webiny,
                payload,
                lambdaContext: context
            };
            const result = await handler(
                params as unknown as EventBridgeEventHandlerCallableParams<
                    string,
                    string,
                    APIGatewayProxyResult
                >
            );

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
