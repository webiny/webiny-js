import { Plugin, PluginsContainer } from "@webiny/plugins/types";

export type HandlerArgs = any[];

export type HandlerContext = {
    plugins: PluginsContainer;
    args: HandlerArgs;
    [key: string]: any;
};

export type HandlerContextPlugin = Plugin & {
    type: "context";
    apply(context: HandlerContext): void;
};

export type HandlerPlugin = Plugin & {
    type: "handler";
    handle(context: HandlerContext, next: Function): Promise<any>;
};

export type ErrorHandlerPlugin = Plugin & {
    type: "error-handler";
    handle(
        context: HandlerContext,
        next: Function
    ): Promise<any>;
};
