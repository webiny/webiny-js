import type {
    APIGatewayProxyResult,
    Context as LambdaContext,
    DynamoDBStreamEvent
} from "aws-lambda";
import { HandlerFactoryParams } from "~/types";
import { createHandler as createBaseHandler } from "@webiny/handler";
import { registerDefaultPlugins } from "~/plugins";
import {
    DynamoDBEventHandler,
    DynamoDBEventHandlerCallableParams
} from "./plugins/DynamoDBEventHandler";
/**
 * We need a class, not an interface exported from types.
 */
// @ts-expect-error
import Reply from "fastify/lib/reply";
import { execute } from "~/execute";
import { createComposedHandler } from "~/utils/composedHandler";

export * from "./plugins/DynamoDBEventHandler";

const url = "/webiny-dynamodb-event";

export type HandlerParams = HandlerFactoryParams;

export interface HandlerCallable {
    (event: DynamoDBStreamEvent, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

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
            .byType<DynamoDBEventHandler>(DynamoDBEventHandler.type)
            .reverse();
        if (plugins.length === 0) {
            throw new Error(
                `To run @webiny/handler-aws/dynamodb, you must have DynamoDBHandler set.`
            );
        }

        const handler = createComposedHandler<
            DynamoDBEventHandler,
            DynamoDBEventHandlerCallableParams<APIGatewayProxyResult>,
            APIGatewayProxyResult
        >(plugins);

        app.post(url, async (request, reply) => {
            const params: Omit<
                DynamoDBEventHandlerCallableParams<APIGatewayProxyResult>,
                "next"
            > = {
                request,
                context: app.webiny,
                event: payload,
                lambdaContext: context,
                reply
            };
            const result = await handler(
                params as unknown as DynamoDBEventHandlerCallableParams<APIGatewayProxyResult>
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
