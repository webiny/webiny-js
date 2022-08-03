import {
    createFastify,
    CreateFastifyHandlerParams as BaseCreateFastifyHandlerParams
} from "@webiny/fastify";
import { DynamoDBStreamEvent, Context as LambdaContext } from "aws-lambda";
import {
    DynamoDBEventHandler,
    DynamoDBEventHandlerCallableParams
} from "./plugins/DynamoDBEventHandler";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { createHandleResponse } from "~/response";

const url = "/webiny-dynamodb-event";

export interface HandlerCallable {
    (event: DynamoDBStreamEvent, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

export interface CreateHandlerParams extends BaseCreateFastifyHandlerParams {
    debug?: boolean;
}

export const createHandler = (params: CreateHandlerParams): HandlerCallable => {
    return (event, context) => {
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
        const plugins = app.webiny.plugins.byType<DynamoDBEventHandler>(DynamoDBEventHandler.type);
        const handler = plugins.shift();
        if (!handler) {
            throw new Error(
                `To run @webiny/handler-fastify-aws/dynamodb, you must have DynamoDBHandler set.`
            );
        }

        app.post(url, async (request, reply) => {
            const params: DynamoDBEventHandlerCallableParams = {
                request,
                context: app.webiny,
                event,
                lambdaContext: context,
                reply
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

export * from "./plugins/DynamoDBEventHandler";
