import type { APIGatewayProxyResult, SNSEvent } from "aws-lambda";
import type { Context as LambdaContext } from "aws-lambda/handler";
import { createHandler as createBaseHandler } from "@webiny/handler";
import { registerDefaultPlugins } from "~/plugins";
import { SNSEventHandler, SNSEventHandlerCallableParams } from "./plugins/SNSEventHandler";
import { execute } from "~/execute";
import { HandlerFactoryParams } from "~/types";
/**
 * We need a class, not an interface exported from types.
 */
// @ts-expect-error
import Reply from "fastify/lib/reply";
import { createComposedHandler } from "~/utils/composedHandler";

export * from "./plugins/SNSEventHandler";

export interface HandlerCallable {
    (event: SNSEvent, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

export type HandlerParams = HandlerFactoryParams;

const url = "/webiny-sns-event";

export const createHandler = (params: HandlerParams): HandlerCallable => {
    return async (event, context) => {
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
        const plugins = app.webiny.plugins.byType<SNSEventHandler>(SNSEventHandler.type).reverse();
        if (plugins.length === 0) {
            throw new Error(`To run @webiny/handler-aws/sns, you must have SNSEventHandler set.`);
        }

        const handler = createComposedHandler<
            SNSEventHandler,
            SNSEventHandlerCallableParams<APIGatewayProxyResult>,
            APIGatewayProxyResult
        >(plugins);

        app.post(url, async (request, reply) => {
            const params: Omit<SNSEventHandlerCallableParams<APIGatewayProxyResult>, "next"> = {
                request,
                reply,
                context: app.webiny,
                event,
                lambdaContext: context
            };

            const result = await handler(
                params as unknown as SNSEventHandlerCallableParams<APIGatewayProxyResult>
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
            payload: event
        });
    };
};
