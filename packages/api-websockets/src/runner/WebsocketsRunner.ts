import WebinyError from "@webiny/error";
import {
    IWebsocketsEvent,
    IWebsocketsEventData,
    IWebsocketsEventRequestContext,
    IWebsocketsIncomingEvent,
    WebsocketsEventRequestContextEventType,
    WebsocketsEventRoute
} from "~/handler/types";
import { Context } from "~/types";
import { IWebsocketsEventValidator } from "~/validator";
import { IWebsocketsRunner, IWebsocketsRunnerResponse } from "./abstractions/IWebsocketsRunner";
import { IWebsocketsRoutePluginCallableParams, WebsocketsRoutePlugin } from "~/plugins";
import { middleware } from "~/utils/middleware";
import { IWebsocketsConnectionRegistry } from "~/registry";
import {
    IWebsocketsResponse,
    IWebsocketsResponseErrorResult,
    IWebsocketsResponseOkResult
} from "~/response";
import { IWebsocketsTransportSendConnection } from "~/transport";
import { IWebsocketsIdentity } from "~/context";

type MiddlewareParams<C extends Context = Context> = Pick<
    IWebsocketsRoutePluginCallableParams<C>,
    "context" | "event" | "registry"
>;

interface IWebsocketsRunnerRespondParams
    extends Pick<
        IWebsocketsEventRequestContext,
        "connectionId" | "domainName" | "stage" | "eventType"
    > {
    messageId?: string;
    result: IWebsocketsResponseOkResult | IWebsocketsResponseErrorResult;
}

export class WebsocketsRunner implements IWebsocketsRunner {
    private readonly context: Context;
    private readonly registry: IWebsocketsConnectionRegistry;
    private readonly validator: IWebsocketsEventValidator;
    private readonly response: IWebsocketsResponse;

    public constructor(
        context: Context,
        registry: IWebsocketsConnectionRegistry,
        validator: IWebsocketsEventValidator,
        response: IWebsocketsResponse
    ) {
        this.context = context;
        this.registry = registry;
        this.validator = validator;
        this.response = response;
    }

    public async run<T extends IWebsocketsEventData = IWebsocketsEventData>(
        input: IWebsocketsIncomingEvent
    ): Promise<IWebsocketsRunnerResponse> {
        let event: IWebsocketsEvent<T> | undefined;
        try {
            event = await this.validator.validate<T>(input);
        } catch (ex) {
            const result = this.response.error({
                message: "Validation failed.",
                error: {
                    message: ex.message,
                    code: ex.code,
                    data: ex.data,
                    stack: ex.stack
                }
            });

            const { connectionId, domainName, stage, eventType } = input.requestContext || {};
            let messageId: string | undefined;
            try {
                const body =
                    typeof input.body === "string" ? input.body : JSON.stringify(input.body || {});
                const json = JSON.parse(body);
                messageId = json.messageId;
            } catch {
                // Do nothing
            }
            if (!connectionId || !stage || !domainName || !eventType) {
                return result;
            }

            await this.respond({
                connectionId,
                domainName,
                stage,
                eventType,
                messageId,
                result
            });
            return result;
        }

        let result: IWebsocketsResponseOkResult | IWebsocketsResponseErrorResult;
        try {
            result = await this.executeRoute(event);
        } catch (ex) {
            result = this.response.error({
                message: `Route "${event.requestContext.routeKey}" action failed.`,
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
                ...event.requestContext,
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

    private getRoutePlugins(route: WebsocketsEventRoute | string): WebsocketsRoutePlugin[] {
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
        /**
         * We will always fetch plugins in reverse order, so that users can override our default ones if necessary.
         */
        const plugins = this.getRoutePlugins(event.requestContext.routeKey).reverse();

        const getTenant = () => {
            const tenant = this.context.tenancy.getCurrentTenant();
            return tenant?.id || null;
        };
        const getLocale = (): string | null => {
            const locale = this.context.i18n.getCurrentLocale("content");
            return locale?.code || null;
        };

        const getIdentity = (): IWebsocketsIdentity | null => {
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
                        getLocale,
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
        const { connectionId, domainName, stage, eventType, result, messageId } = params;
        if (eventType !== WebsocketsEventRequestContextEventType.message) {
            return;
        } else if (!connectionId || !domainName || !stage) {
            const message = "No connectionId, domainName or stage.";
            const data = {
                connectionId,
                domainName,
                stage
            };
            console.error(message, JSON.stringify(data));
            throw new WebinyError(message, "GENERAL_ERROR", data);
        }
        const connection: IWebsocketsTransportSendConnection = {
            connectionId,
            domainName,
            stage
        };

        const dataToSend = {
            ...result,
            messageId
        };
        await this.context.websockets.sendToConnections([connection], dataToSend);
    }
}
