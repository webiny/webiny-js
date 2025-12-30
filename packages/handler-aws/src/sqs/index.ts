import type {
    APIGatewayProxyResult,
    Context as LambdaContext,
    SQSEvent
} from "@webiny/aws-sdk/types/index.js";
import { createHandler as createBaseHandler } from "@webiny/handler";
import { registerDefaultPlugins } from "~/plugins/index.js";
import type { SQSEventHandlerCallableParams } from "~/sqs/plugins/SQSEventHandler.js";
import { SQSEventHandler } from "~/sqs/plugins/SQSEventHandler.js";
import { execute } from "~/execute.js";
import type { HandlerFactoryParams } from "~/types.js";
/**
 * We need a class, not an interface exported from types.
 */
// @ts-expect-error
import Reply from "fastify/lib/reply.js";
import { createComposedHandler } from "~/utils/composedHandler.js";

export * from "./plugins/SQSEventHandler.js";

export interface HandlerCallable {
    (event: SQSEvent, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

export type HandlerParams = HandlerFactoryParams;

const url = "/webiny-sqs-event";

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
        const plugins = app.webiny.plugins.byType<SQSEventHandler>(SQSEventHandler.type).reverse();
        if (plugins.length === 0) {
            throw new Error(`To run @webiny/handler-aws/sqs, you must have SQSEventHandler set.`);
        }

        const handler = createComposedHandler<
            SQSEventHandler,
            SQSEventHandlerCallableParams<APIGatewayProxyResult>,
            APIGatewayProxyResult
        >(plugins);

        app.post(url, async (request, reply) => {
            const params: Omit<SQSEventHandlerCallableParams<APIGatewayProxyResult>, "next"> = {
                request,
                reply,
                context: app.webiny,
                event,
                lambdaContext: context
            };

            const result = await handler(
                params as unknown as SQSEventHandlerCallableParams<APIGatewayProxyResult>
            );

            if (result instanceof Reply) {
                return result;
            }

            app.__WBY_raw_result = result;
            if (!reply.sent) {
                reply.send({});
            }
            return reply;
        });
        return execute({
            app,
            url,
            payload: event
        });
    };
};
