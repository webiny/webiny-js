import { createHandler as createBaseHandler } from "@webiny/handler";
import { registerDefaultPlugins } from "~/plugins/index.js";
import type { S3EventHandlerCallableParams } from "~/s3/plugins/S3EventHandler.js";
import { S3EventHandler } from "~/s3/plugins/S3EventHandler.js";
import { execute } from "~/execute.js";
import type { HandlerFactoryParams } from "~/types.js";
/**
 * We need a class, not an interface exported from types.
 */
// @ts-expect-error
import Reply from "fastify/lib/reply.js";
import type {
    APIGatewayProxyResult,
    Context as LambdaContext,
    S3Event
} from "@webiny/aws-sdk/types/index.js";
import { createComposedHandler } from "~/utils/composedHandler.js";

export * from "./plugins/S3EventHandler.js";

export interface HandlerCallable {
    (event: S3Event, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

export type HandlerParams = HandlerFactoryParams;

const url = "/webiny-s3-event";

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
        const plugins = app.webiny.plugins.byType<S3EventHandler>(S3EventHandler.type).reverse();
        if (plugins.length === 0) {
            throw new Error(`To run @webiny/handler-aws/s3, you must have S3EventHandler set.`);
        }

        const handler = createComposedHandler<
            S3EventHandler,
            S3EventHandlerCallableParams<APIGatewayProxyResult>,
            APIGatewayProxyResult
        >(plugins);

        app.post(url, async (request, reply) => {
            const params: Omit<S3EventHandlerCallableParams<APIGatewayProxyResult>, "next"> = {
                request,
                reply,
                context: app.webiny,
                event,
                lambdaContext: context
            };
            const result = await handler(
                params as unknown as S3EventHandlerCallableParams<APIGatewayProxyResult>
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
            payload: event
        });
    };
};
