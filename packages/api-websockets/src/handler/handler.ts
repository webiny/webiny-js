import WebinyError from "@webiny/error";
import { createHandler as createBaseHandler } from "@webiny/handler";
import { registerDefaultPlugins } from "@webiny/handler-aws/plugins";
import { execute } from "@webiny/handler-aws/execute";
import { PluginsContainer } from "@webiny/plugins";
import { createWebsocketsRoutePlugins } from "~/runner/routes";
import { WebsocketsEventValidator } from "~/validator";
import { WebsocketsResponse } from "~/response";
import { Context } from "~/types";
import { WebsocketsRunner } from "~/runner";
import { PluginCollection } from "@webiny/plugins/types";
import { HandlerCallable, HandlerParams } from "./types";
import { getEventValues } from "./headers";

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
    plugins.register(...createWebsocketsRoutePlugins());

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
            const { validator, response } = params;
            const context = app.webiny as Context;
            const handler = new WebsocketsRunner(
                context,
                context.websockets.registry,
                validator || new WebsocketsEventValidator(),
                response || new WebsocketsResponse()
            );

            const result = await handler.run(event);

            return reply
                .status(result.statusCode)
                .headers({
                    "Sec-WebSocket-Protocol": "webiny-ws-v1"
                })
                .send(result);
        });

        const { tenant, locale, endpoint, token } = getEventValues(event);

        const headers = {
            Authorization: `Bearer ${token}`,
            ["x-tenant"]: tenant,
            ["x-webiny-cms-locale"]: locale,
            ["x-webiny-cms-endpoint"]: endpoint,
            ...event.headers
        };

        return execute({
            app,
            url,
            payload: {
                ...event,
                headers
            }
        });
    };
};
