import { HandlerPlugin as DefaultHandlerPlugin, Context } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { Plugin } from "@webiny/plugins/types";

export interface Configuration {
    website?: {
        url?: string;
    };
    storage?: {
        name?: string;
        folder?: string;
    };
    meta?: {
        cloudfront?: {
            distributionId?: string;
        };
    };
}

export interface Args {
    configuration?: Configuration;
    url?: string;
    path?: string;
}

export type HandlerArgs = Args | Args[];
export interface HandlerContext extends Context, ArgsContext<HandlerArgs> {}
export interface HandlerResponse {
    data: Record<string, any>;
    error: Record<string, any>;
}
export type HandlerPlugin = DefaultHandlerPlugin<HandlerContext>;

export interface HookCallbackFunctionParams {
    context: HandlerContext;
    configuration: Configuration;
    args: HandlerArgs;
}
export type HookCallbackFunction = (params: HookCallbackFunctionParams) => void | Promise<void>;

export type FlushHookPlugin = Plugin<{
    type: "ps-flush-hook";
    beforeFlush?: HookCallbackFunction;
    afterFlush?: HookCallbackFunction;
}>;

export type RenderHookPlugin = Plugin<{
    type: "ps-flush-hook";
    beforeFlush?: HookCallbackFunction;
    afterFlush?: HookCallbackFunction;
}>;
