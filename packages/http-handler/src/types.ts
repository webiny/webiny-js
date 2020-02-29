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

export type HttpBeforeHandlerPlugin = Plugin & {
    type: "before-handler";
    handle(params: { context: HttpContext; args: HttpArgs }): Promise<void>;
};

export type HttpHandlerPlugin = Plugin & {
    type: "handler";
    canHandle(params: { context: HttpContext; args: HttpArgs }): boolean;
    handle(params: { context: HttpContext; args: HttpArgs }): Promise<any>;
};

export type HttpErrorHandlerPlugin = Plugin & {
    type: "error-handler";
    canHandle(params: { context: HttpContext; args: HttpArgs; error: any }): boolean;
    handle(params: { context: HttpContext; args: HttpArgs; error: any }): Promise<any>;
};

export type HttpAfterHandlerPlugin = Plugin & {
    type: "after-handler";
    handle(params: { context: HttpContext; args: HttpArgs; result: any }): Promise<void>;
};
