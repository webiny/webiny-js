import WebinyError from "@webiny/error";
import type {
    IWebsocketsEvent,
    IWebsocketsEventContext,
    IWebsocketsEventData,
    WebsocketsRoute,
    WebsocketsEventType,
    Context
} from "~/types.js";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";
import type { IWebsocketsRunner } from "./abstractions/WebsocketsRunner.js";
import type { IWebsocketsRunnerResponse } from "./abstractions/WebsocketsRunner.js";
import type { IWebsocketsRoutePluginCallableParams } from "~/plugins/index.js";
import { WebsocketsRoutePlugin } from "~/plugins/index.js";
import { middleware } from "~/utils/middleware.js";
import type { IWebsocketsResponse } from "~/response/index.js";
import type { IWebsocketsResponseErrorResult } from "~/response/index.js";
import type { IWebsocketsResponseOkResult } from "~/response/index.js";
import { WebsocketsTransport } from "~/transport/index.js";
import { WebsocketsSendToConnectionsUseCase } from "~/features/SendToConnections/abstractions.js";

type MiddlewareParams<C extends Context = Context> = Pick<
    IWebsocketsRoutePluginCallableParams<C>,
    "context" | "event" | "registry"
>;

interface IWebsocketsRunnerRespondParams extends Pick<
    IWebsocketsEventContext,
    "connectionId" | "endpoint" | "eventType"
> {
    messageId?: string;
    result: IWebsocketsResponseOkResult | IWebsocketsResponseErrorResult;
}

export class WebsocketsRunner implements IWebsocketsRunner {
    private readonly context: Context;
    private readonly registry: ConnectionRegistry.Interface;
    private readonly response: IWebsocketsResponse;
    private readonly sendToConnections: WebsocketsSendToConnectionsUseCase.Interface;

    public constructor(context: Context, response: IWebsocketsResponse) {
        this.context = context;
        this.registry = context.container.resolve(ConnectionRegistry);
        this.response = response;
        this.sendToConnections = context.container.resolve(WebsocketsSendToConnectionsUseCase);
    }

    public async run<T extends IWebsocketsEventData = IWebsocketsEventData>(
        event: IWebsocketsEvent<T>
    ): Promise<IWebsocketsRunnerResponse> {
        let result: IWebsocketsResponseOkResult | IWebsocketsResponseErrorResult;
        try {
            result = await this.executeRoute(event);
        } catch (ex) {
            result = this.response.error({
                message: `Route "${event.context.route}" action failed.`,
                error: {
                    message: ex.message,
                    code: ex.code,
                    data: ex.data,
                    stack: ex.stack
                }
            });
        }
        try {
            await this.respond({
                connectionId: event.context.connectionId,
                endpoint: event.context.endpoint,
                eventType: event.context.eventType,
                messageId: event.body?.messageId,
                result
            });
            return result;
        } catch (ex) {
            return this.response.error({
                message: "Failed to respond to the request.",
                error: {
                    message: ex.message,
                    code: ex.code,
                    data: {
                        ...ex.data,
                        result
                    },
                    stack: ex.stack
                }
            });
        }
    }

    private getRoutePlugins(route: WebsocketsRoute | string): WebsocketsRoutePlugin[] {
        const plugins = this.context.plugins
            .byType<WebsocketsRoutePlugin>(WebsocketsRoutePlugin.type)
            .filter(plugin => {
                return plugin.route === route;
            });
        if (plugins.length === 0) {
            throw new WebinyError(
                `There are no plugins for the route: ${route}.`,
                "NO_ROUTE_PLUGINS",
                {
                    route
                }
            );
        }
        return plugins;
    }

    private async executeRoute(event: IWebsocketsEvent): Promise<IWebsocketsRunnerResponse> {
        const plugins = this.getRoutePlugins(event.context.route).reverse();

        const getTenant = () => {
            const tenant = this.context.tenancy.getCurrentTenant();
            return tenant?.id || null;
        };

        const getIdentity = (): ConnectionRegistry.Identity | null => {
            const identity = this.context.security.getIdentity();
            return identity || null;
        };

        const action = middleware<MiddlewareParams, IWebsocketsRunnerResponse>(
            plugins.map(plugin => {
                return async (params, next) => {
                    return plugin.run({
                        registry: params.registry,
                        event: params.event,
                        context: params.context,
                        getTenant,
                        getIdentity,
                        response: this.response,
                        next
                    });
                };
            })
        );

        const result = await action({
            event,
            registry: this.registry,
            context: this.context
        });
        if (result) {
            return result;
        }
        const message = "No response from the route action.";
        return this.response.error({
            message,
            error: {
                message,
                code: "NO_RESPONSE"
            },
            statusCode: 404
        });
    }

    private async respond(params: IWebsocketsRunnerRespondParams): Promise<void> {
        const { connectionId, endpoint, eventType, result, messageId } = params;
        if (eventType !== "message") {
            return;
        } else if (!connectionId || !endpoint) {
            const message = "No connectionId or endpoint.";
            const data = {
                connectionId,
                endpoint
            };
            console.error(message, JSON.stringify(data));
            throw new WebinyError(message, "GENERAL_ERROR", data);
        }
        const connection: WebsocketsTransport.SendConnection = {
            connectionId,
            endpoint
        };

        const dataToSend = {
            ...result,
            messageId
        };
        await this.sendToConnections.execute([connection], dataToSend);
    }
}

export namespace WebsocketsRunner {
    export type Event<T extends IWebsocketsEventData = IWebsocketsEventData> = IWebsocketsEvent<T>;
    export type EventData = IWebsocketsEventData;
    export type EventContext = IWebsocketsEventContext;
    export type EventType = WebsocketsEventType;
    export type Route = WebsocketsRoute;
    export type Response = IWebsocketsRunnerResponse;
}
