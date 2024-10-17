import { createHandler as createBaseHandler } from "@webiny/handler";
import { registerDefaultPlugins } from "@webiny/handler-aws/plugins";
import { execute } from "@webiny/handler-aws/execute";
import { APIGatewayProxyResult } from "aws-lambda";
import { Context as LambdaContext } from "aws-lambda/handler";
import { Context, TaskResponseStatus } from "~/types";
import { HandlerParams, ITaskRawEvent } from "~/handler/types";
import { TaskRunner } from "~/runner";
import WebinyError from "@webiny/error";
import { timerFactory } from "@webiny/handler-aws/utils";
import { TaskEventValidation } from "~/runner/TaskEventValidation";

export interface HandlerCallable {
    (event: ITaskRawEvent, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

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

        registerDefaultPlugins(app.webiny);

        app.addHook("preSerialization", async (_, __, payload: Record<string, any>) => {
            if (!payload.body) {
                return payload;
            }
            return payload.body;
        });

        app.setErrorHandler<WebinyError>(async (error, _, reply) => {
            app.__webiny_raw_result = {
                error: {
                    message: error.message,
                    code: error.code,
                    data: error.data
                },
                status: TaskResponseStatus.ERROR
            };
            return reply.send();
        });

        app.post(url, async (_, reply) => {
            const handler = new TaskRunner(
                /**
                 * We can safely cast because we know that the context is of type tasks/Context
                 */
                app.webiny as Context,
                timerFactory(context),
                new TaskEventValidation()
            );

            app.__webiny_raw_result = await handler.run(event);
            return reply.send({});
        });
        return execute({
            app,
            url,
            payload: {
                ...event,
                headers: {
                    ["x-tenant"]: event.tenant,
                    ["x-webiny-cms-endpoint"]: event.endpoint,
                    ["x-webiny-cms-locale"]: event.locale,
                    ["x-i18n-locale"]: event.locale,
                    ["accept-language"]: event.locale
                }
            }
        });
    };
};
