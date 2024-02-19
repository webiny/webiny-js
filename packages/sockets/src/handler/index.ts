import WebinyError from "@webiny/error";
import { createHandler as createBaseHandler } from "@webiny/handler";
import { registerDefaultPlugins } from "@webiny/handler-aws/plugins";
import { execute } from "@webiny/handler-aws/execute";
import { PluginsContainer } from "@webiny/plugins";
import { HandlerFactoryParams } from "@webiny/handler-aws/types";
import { APIGatewayProxyResult } from "aws-lambda";
import { Context as LambdaContext } from "aws-lambda/handler";
import { ISocketsEvent } from "./types";
import { createSocketsRoutePlugins } from "~/runner/actions";
import { SocketsEventValidator } from "~/validator/SocketsEventValidator";
import { Context } from "~/types";
import { SocketsRunner } from "~/runner";
import { PluginCollection } from "@webiny/plugins/types";

export interface HandlerCallable {
    (event: ISocketsEvent, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

export type HandlerParams = HandlerFactoryParams;

const url = "/webiny-websockets";

const createPluginsContainer = (
    plugins?: PluginsContainer | PluginCollection
): PluginsContainer => {
    if (plugins instanceof PluginsContainer) {
        return plugins;
    }
    return new PluginsContainer(plugins || []);
};

export const createHandler = (params: HandlerParams): HandlerCallable => {
    const plugins = createPluginsContainer(params.plugins);
    plugins.register(...createSocketsRoutePlugins());

    return async event => {
        const app = createBaseHandler({
            ...params,
            plugins,
            options: {
                logger: params.debug === true,
                ...(params.options || {})
            }
        });

        registerDefaultPlugins(app.webiny);

        app.setErrorHandler<WebinyError>(async (error, _, reply) => {
            app.__webiny_raw_result = {
                error: {
                    message: error.message,
                    code: error.code,
                    data: error.data
                },
                statusCode: 200
            };
            return reply.send({});
        });

        app.post(url, async (_, reply) => {
            const context = app.webiny as Context;
            const validator = new SocketsEventValidator();
            const handler = new SocketsRunner(context, context.sockets.registry, validator);

            app.__webiny_raw_result = await handler.run(event);
            return reply.send({});
        });
        return execute({
            app,
            url,
            payload: {
                ...event,
                headers: {
                    ["x-tenant"]: event.data.tenant,
                    ["x-webiny-cms-endpoint"]: "manage",
                    ["x-webiny-cms-locale"]: event.data.locale
                }
            }
        });
    };
};
