import { createHandler as createBaseHandler } from "@webiny/handler";
import { registerDefaultPlugins } from "@webiny/handler-aws/plugins";
import { execute } from "@webiny/handler-aws/execute";
import { HandlerFactoryParams } from "@webiny/handler-aws/types";
import { APIGatewayProxyResult } from "aws-lambda";
import { Context as LambdaContext } from "aws-lambda/handler";
import { Context } from "~/types";
import { ITaskEvent } from "~/handler/types";
import { ITaskRunnerParams, TaskRunner } from "~/runner";

export interface HandlerCallable {
    (event: ITaskEvent, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

export type HandlerParams = HandlerFactoryParams;

const url = "/webiny-background-task-event";

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

        app.post(url, async (request, reply) => {
            const params: ITaskRunnerParams = {
                request,
                reply,
                /**
                 * We can safely cast because we know that the context is of type tasks/Context
                 */
                context: app.webiny as Context,
                event,
                lambdaContext: context
            };

            const handler = new TaskRunner(params);

            app.__webiny_raw_result = await handler.run();
            return reply.send({});
        });
        return execute({
            app,
            url,
            payload: event
        });
    };
};
