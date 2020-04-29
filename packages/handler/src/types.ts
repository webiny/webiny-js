import { Plugin, PluginsContainer } from "@webiny/plugins/types";

export type HandlerContext = {
    plugins: PluginsContainer;
    [key: string]: any;
};

export type HandlerArgs = any[];

export type HandlerContextPlugin = Plugin & {
    type: "handler-context";
    apply(params: { context: HandlerContext; args: HandlerArgs }): void;
};

export type HandlerPlugin = Plugin & {
    type: "handler";
    handle(params: { context: HandlerContext; args: HandlerArgs }, next: Function): Promise<any>;
};

export type ErrorHandlerPlugin = Plugin & {
    type: "error-handler";
    handle(
        params: { context: HandlerContext; args: HandlerArgs; error: any },
        next: Function
    ): Promise<any>;
};
