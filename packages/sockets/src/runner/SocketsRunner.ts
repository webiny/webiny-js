import WebinyError from "@webiny/error";
import { ISocketsEvent, ISocketsEventData, SocketsEventRoute } from "~/handler/types";
import { Context } from "~/types";
import { ISocketsEventValidator } from "~/validator";
import {
    ISocketsRunner,
    ISocketsRunnerResponse,
    ISocketsRunnerRunParams
} from "./abstractions/ISocketsRunner";
import { ISocketsRoutePluginCallableParams, SocketsRoutePlugin } from "~/plugins";
import { middleware } from "@webiny/utils";
import { ISocketsConnectionRegistry } from "~/registry";
import {
    ISocketsResponse,
    ISocketsResponseErrorResult,
    ISocketsResponseOkResult
} from "~/response";
import { SecurityIdentity } from "@webiny/api-security/types";
import { ISocketsTransporterSendConnection } from "~/transporter";

type MiddlewareParams<C extends Context = Context> = Pick<
    ISocketsRoutePluginCallableParams<C>,
    "context" | "event" | "registry"
>;

export class SocketsRunner implements ISocketsRunner {
    private readonly context: Context;
    private readonly registry: ISocketsConnectionRegistry;
    private readonly validator: ISocketsEventValidator;
    private readonly response: ISocketsResponse;

    public constructor(
        context: Context,
        registry: ISocketsConnectionRegistry,
        validator: ISocketsEventValidator,
        response: ISocketsResponse
    ) {
        this.context = context;
        this.registry = registry;
        this.validator = validator;
        this.response = response;
    }

    public async run<T extends ISocketsEventData = ISocketsEventData>(
        input: ISocketsRunnerRunParams<T>
    ): Promise<ISocketsRunnerResponse> {
        let event: ISocketsEvent<T> | undefined;
        try {
            event = await this.validator.validate<T>(input);
        } catch (ex) {
            return this.response.error({
                message: "Validation failed.",
                error: {
                    message: ex.message,
                    code: ex.code,
                    data: ex.data,
                    stack: ex.stack
                }
            });
        }

        let result: ISocketsResponseOkResult | ISocketsResponseErrorResult;
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
            await this.respond(event, result);
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

    private getRoutePlugins(action: SocketsEventRoute | string): SocketsRoutePlugin[] {
        const plugins = this.context.plugins
            .byType<SocketsRoutePlugin>(SocketsRoutePlugin.type)
            .filter(plugin => {
                return plugin.route === action;
            });
        if (plugins.length === 0) {
            throw new WebinyError(
                `There are no action plugins for "${action}"`,
                "NO_ACTION_PLUGINS",
                {
                    action
                }
            );
        }
        return plugins;
    }

    private async executeRoute(event: ISocketsEvent): Promise<ISocketsRunnerResponse> {
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

        const getIdentity = (): SecurityIdentity | null => {
            const identity = this.context.security.getIdentity();
            return identity || null;
        };

        const action = middleware<MiddlewareParams, ISocketsRunnerResponse>(
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

    private async respond(
        event: ISocketsEvent,
        result: ISocketsResponseOkResult | ISocketsResponseErrorResult
    ): Promise<void> {
        const { connectionId, domainName, stage } = event.requestContext;
        if (!connectionId || !domainName || !stage) {
            const message = "No connectionId, domainName or stage.";
            const data = {
                connectionId,
                domainName,
                stage
            };
            console.log(message, JSON.stringify(data));
            throw new WebinyError(message, "GENERAL_ERROR", data);
        }
        const connection: ISocketsTransporterSendConnection = {
            connectionId,
            domainName,
            stage
        };
        console.log(
            "sending: " +
                JSON.stringify({
                    connection,
                    result
                })
        );
        await this.context.sockets.sendToConnection(connection, result);
    }
}
