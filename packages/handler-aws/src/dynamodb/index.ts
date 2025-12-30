import type {
    APIGatewayProxyResult,
    Context as LambdaContext,
    DynamoDBStreamEvent
} from "@webiny/aws-sdk/types/index.js";
import type { HandlerFactoryParams } from "~/types.js";
import { createHandler as createBaseHandler } from "@webiny/handler";
import { registerDefaultPlugins } from "~/plugins/index.js";
import type { DynamoDBEventHandlerCallableParams } from "./plugins/DynamoDBEventHandler.js";
import { DynamoDBEventHandler } from "./plugins/DynamoDBEventHandler.js";
/**
 * We need a class, not an interface exported from types.
 */
// @ts-expect-error
import Reply from "fastify/lib/reply.js";
import { execute } from "~/execute.js";
import { createComposedHandler } from "~/utils/composedHandler.js";

export * from "./plugins/DynamoDBEventHandler.js";

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

            app.__WBY_raw_result = result;
            return reply.send({});
        });
        return execute({
            app,
            url,
            payload
        });
    };
};
