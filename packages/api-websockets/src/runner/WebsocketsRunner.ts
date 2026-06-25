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
import { WebsocketsRouteHandler } from "~/features/Routes/abstractions.js";
import { middleware } from "~/utils/middleware.js";
import { WebsocketsResponse } from "~/response/index.js";
import { WebsocketsTransport } from "~/transport/index.js";
import { WebsocketsSendToConnectionsUseCase } from "~/features/SendToConnections/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";

type MiddlewareParams = Pick<WebsocketsRouteHandler.Params, "event" | "registry" | "container">;

interface IWebsocketsRunnerRespondParams extends Pick<
    IWebsocketsEventContext,
    "connectionId" | "endpoint" | "eventType"
> {
    messageId?: string;
    result: WebsocketsResponse.OkResult | WebsocketsResponse.ErrorResult;
}

export class WebsocketsRunner implements IWebsocketsRunner {
    private readonly context: Context;
    private readonly registry: ConnectionRegistry.Interface;
    private readonly response: WebsocketsResponse.Interface;
    private readonly sendToConnections: WebsocketsSendToConnectionsUseCase.Interface;

    public constructor(context: Context, response: WebsocketsResponse.Interface) {
        this.context = context;
        this.registry = context.container.resolve(ConnectionRegistry);
        this.response = response;
        this.sendToConnections = context.container.resolve(WebsocketsSendToConnectionsUseCase);
    }

    public async run<T extends IWebsocketsEventData = IWebsocketsEventData>(
        event: IWebsocketsEvent<T>
    ): Promise<IWebsocketsRunnerResponse> {
        let result: WebsocketsResponse.OkResult | WebsocketsResponse.ErrorResult;
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

    private getRouteHandlers(route: WebsocketsRoute | string): WebsocketsRouteHandler.Interface[] {
        const handlers = this.context.container
            .resolveAll(WebsocketsRouteHandler)
            .filter(handler => handler.route === route);
        if (handlers.length === 0) {
            throw new WebinyError(
                `There are no handlers for the route: ${route}.`,
                "NO_ROUTE_HANDLERS",
                {
                    route
                }
            );
        }
        return handlers;
    }

    private async executeRoute(event: IWebsocketsEvent): Promise<IWebsocketsRunnerResponse> {
        const handlers = this.getRouteHandlers(event.context.route).reverse();

        const getTenant = () => {
            const tenant = this.context.container.resolve(TenantContext).getTenant();
            return tenant?.id || null;
        };

        const getIdentity = (): ConnectionRegistry.Identity | null => {
            const identity = this.context.container.resolve(IdentityContext).getIdentity();
            return identity || null;
        };

        const action = middleware<MiddlewareParams, IWebsocketsRunnerResponse>(
            handlers.map(handler => {
                return async (params, next) => {
                    return handler.run({
                        registry: params.registry,
                        event: params.event,
                        container: params.container,
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
            container: this.context.container
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
