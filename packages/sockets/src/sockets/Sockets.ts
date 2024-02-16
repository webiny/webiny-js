import { ISocketsEvent, SocketsEventRoute } from "~/handler/types";
import { ISocketsConnectionRegistry } from "~/registry";
import { Context } from "~/types";
import { ISocketsEventValidator } from "./abstractions/ISocketsEventValidator";
import { ISockets, ISocketsResponse } from "./abstractions/ISockets";
import { SocketsRoutePlugin } from "~/plugins/SocketsRoutePlugin";
import { middleware } from "@webiny/handler/middleware";

export class Sockets implements ISockets {
    public readonly context: Context;
    public readonly registry: ISocketsConnectionRegistry;
    private readonly validator: ISocketsEventValidator;

    public constructor(
        context: Context,
        registry: ISocketsConnectionRegistry,
        validator: ISocketsEventValidator
    ) {
        this.context = context;
        this.registry = registry;
        this.validator = validator;
    }

    public async run(input: Partial<ISocketsEvent>): Promise<ISocketsResponse> {
        let event: ISocketsEvent | undefined;
        try {
            event = await this.validator.validate(input);
        } catch (ex) {
            return {
                statusCode: 500,
                message: "Validation failed.",
                error: {
                    message: ex.message,
                    code: ex.code,
                    data: ex.data,
                    stack: ex.stack
                }
            };
        }

        try {
            return await this.runRouteAction(event);
        } catch (ex) {
            return {
                statusCode: 500,
                message: `Route "${event.requestContext.routeKey}" action failed.`,
                error: {
                    message: ex.message,
                    code: ex.code,
                    data: ex.data,
                    stack: ex.stack
                }
            };
        }
    }

    private getRoutePlugins(action: SocketsEventRoute | string): SocketsRoutePlugin[] {
        const plugins = this.context.plugins
            .byType<SocketsRoutePlugin>(SocketsRoutePlugin.type)
            .filter(plugin => {
                return plugin.route === action;
            });
        if (plugins.length === 0) {
            throw new Error(`There are no action plugins for "${action}"`);
        }
        return plugins;
    }

    public runRouteAction(event: ISocketsEvent): Promise<ISocketsResponse> {
        /**
         * We will always fetch plugins in reverse order, so that users can override our default ones if necessary.
         */
        const plugins = this.getRoutePlugins(event.requestContext.routeKey).reverse();

        const action = middleware(plugins.map(plugin => plugin.run));

        return action({
            event,
            sockets: this,
            context: this.context
        });
    }
}
