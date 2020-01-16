import { Plugin, PluginsContainer } from "@webiny/plugins/types";

export type HttpContext = {
    plugins: PluginsContainer;
    [key: string]: any;
};

export type HttpArgs = any[];

export type HttpContextPlugin = Plugin & {
    type: "context";
    apply(params: { context: HttpContext; args: HttpArgs }): void;
};

export type HttpBeforeHandlePlugin = Plugin & {
    type: "before-handle";
    handle(params: { context: HttpContext; args: HttpArgs }): Promise<void>;
};

export type HttpHandlerPlugin = Plugin & {
    type: "handler";
    canHandle(params: { context: HttpContext; args: HttpArgs }): boolean;
    handle(params: { context: HttpContext; args: HttpArgs }): Promise<any>;
};

export type HttpAfterHandlePlugin = Plugin & {
    type: "after-handle";
    handle(params: { context: HttpContext; args: HttpArgs; result: any }): Promise<void>;
};
