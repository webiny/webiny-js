import {
    createHandler as createBaseHandler,
    CreateHandlerParams as BaseCreateHandlerParams
} from "@webiny/handler";
const Reply = require("fastify/lib/reply");
import { DynamoDBStreamEvent, Context as LambdaContext } from "aws-lambda";
import {
    DynamoDBEventHandler,
    DynamoDBEventHandlerCallableParams
} from "./plugins/DynamoDBEventHandler";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { registerDefaultPlugins } from "~/plugins";
import { execute } from "~/execute";

const url = "/webiny-dynamodb-event";

export interface HandlerCallable {
    (event: DynamoDBStreamEvent, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

export interface CreateHandlerParams extends BaseCreateHandlerParams {
    debug?: boolean;
}

export const createHandler = (params: CreateHandlerParams): HandlerCallable => {
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
        const plugins = app.webiny.plugins.byType<DynamoDBEventHandler>(DynamoDBEventHandler.type);
        const handler = plugins.shift();
        if (!handler) {
            throw new Error(
                `To run @webiny/handler-aws/dynamodb, you must have DynamoDBHandler set.`
            );
        }

        app.post(url, async (request, reply) => {
            const params: DynamoDBEventHandlerCallableParams = {
                request,
                context: app.webiny,
                event: payload,
                lambdaContext: context,
                reply
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

export * from "./plugins/DynamoDBEventHandler";
