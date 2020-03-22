import { Plugin, PluginsContainer } from "@webiny/plugins/types";

export type HttpHandlerContext = {
    plugins: PluginsContainer;
    [key: string]: any;
};

export type HttpArgs = any[];

export type HttpContextPlugin = Plugin & {
    type: "context";
    apply(params: { context: HttpHandlerContext; args: HttpArgs }): void;
};

export type HttpBeforeHandlerPlugin = Plugin & {
    type: "before-handler";
    handle(params: { context: HttpHandlerContext; args: HttpArgs }): Promise<void>;
};

export type HttpHandlerPlugin = Plugin & {
    type: "handler";
    canHandle(params: { context: HttpHandlerContext; args: HttpArgs }): boolean;
    handle(params: { context: HttpHandlerContext; args: HttpArgs }): Promise<any>;
};

export type HttpErrorHandlerPlugin = Plugin & {
    type: "error-handler";
    canHandle(params: { context: HttpHandlerContext; args: HttpArgs; error: any }): boolean;
    handle(params: { context: HttpHandlerContext; args: HttpArgs; error: any }): Promise<any>;
};

export type HttpAfterHandlerPlugin = Plugin & {
    type: "after-handler";
    handle(params: { context: HttpHandlerContext; args: HttpArgs; result: any }): Promise<void>;
};
