import type WebinyError from "@webiny/error";
import { createHandler as createBaseHandler } from "@webiny/handler";
import { registerDefaultPlugins } from "@webiny/handler-aws/plugins/index.js";
import { execute } from "@webiny/handler-aws/execute.js";
import { PluginsContainer } from "@webiny/plugins";
import { createWebsocketsRoutePlugins, WebsocketsRunner } from "@webiny/api-websockets";
import { WebsocketsResponse } from "@webiny/api-websockets/response/WebsocketsResponse.js";
import type { Context } from "@webiny/api-websockets";
import type { PluginCollection } from "@webiny/plugins/types.js";
import type { HandlerCallable, HandlerParams } from "./types.js";
import { getEventValues } from "./headers.js";
import { AwsWebsocketsEventValidator } from "~/validator/AwsWebsocketsEventValidator.js";
import { WebsocketsTransport } from "@webiny/api-websockets";

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

    const validator = new AwsWebsocketsEventValidator();

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

        await app.register(async wsApp => {
            wsApp.setErrorHandler<WebinyError>(async (error, _, reply) => {
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

            wsApp.post(url, async (_, reply) => {
                const { response } = params;
                const context = app.webiny as Context;

                const responseObj = response || new WebsocketsResponse();
                const runner = new WebsocketsRunner(
                    context,
                    context.websockets.registry,
                    responseObj
                );

                let validatedEvent;
                try {
                    validatedEvent = await validator.validate(event);
                } catch (ex) {
                    const errorResult = responseObj.error({
                        message: "Validation failed.",
                        error: {
                            message: ex.message,
                            code: ex.code,
                            data: ex.data,
                            stack: ex.stack
                        }
                    });

                    const { connectionId, domainName, stage, eventType } =
                        event.requestContext || {};
                    if (connectionId && domainName && stage && eventType === "MESSAGE") {
                        try {
                            const transport = context.container.resolve(WebsocketsTransport);
                            const endpoint = `https://${domainName}/${stage}`;
                            await transport.send([{ connectionId, endpoint }], errorResult);
                        } catch {
                            /* best effort. */
                        }
                    }

                    app.__webiny_raw_result = {
                        statusCode: errorResult.statusCode,
                        headers: {
                            "sec-websocket-protocol": "webiny-ws-v1"
                        }
                    };
                    return reply.send();
                }

                const result = await runner.run(validatedEvent);

                app.__webiny_raw_result = {
                    statusCode: result.statusCode,
                    headers: {
                        "sec-websocket-protocol": "webiny-ws-v1"
                    }
                };

                return reply.send();
            });
        });

        const { tenant, endpoint, token } = getEventValues(event);

        const headers = {
            Authorization: `Bearer ${token}`,
            ["x-tenant"]: tenant,
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
