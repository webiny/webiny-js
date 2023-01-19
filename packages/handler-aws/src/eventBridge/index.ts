import {
    createHandler as createBaseHandler,
    CreateHandlerParams as BaseCreateHandlerParams
} from "@webiny/handler";
const Reply = require("fastify/lib/reply");
import { EventBridgeEvent, Context as LambdaContext } from "aws-lambda";
import {
    EventBridgeEventHandler,
    EventBridgeEventHandlerCallableParams
} from "./plugins/EventBridgeEventHandler";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { registerDefaultPlugins } from "~/plugins";
import { execute } from "~/execute";

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
        const plugins = app.webiny.plugins.byType<EventBridgeEventHandler<DetailType, Detail>>(
            EventBridgeEventHandler.type
        );
        const handler = plugins.shift();
        if (!handler) {
            throw new Error(
                `To run @webiny/handler-aws/eventBridge, you must have EventBridgeEventHandler set.`
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
        return execute({
            app,
            url,
            payload
        });
    };
};

export * from "./plugins/EventBridgeEventHandler";
