import { HandlerPlugin as DefaultHandlerPlugin, ContextInterface } from "@webiny/handler/types";
import { PrerenderingServiceStorageOperations, Render } from "~/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { Plugin } from "@webiny/plugins/types";

export interface Configuration {
    website?: {
        url?: string;
    };
    db?: {
        namespace?: string;
    };
    meta?: Record<string, any>;
}

export interface Args {
    configuration?: Configuration;
    url?: string;
    path?: string;
}

export type HandlerArgs = Args | Args[];
export interface HandlerContext extends ContextInterface, ArgsContext<HandlerArgs> {
    //
}
export type HandlerPlugin = DefaultHandlerPlugin<HandlerContext>;

export type HookCallbackFunction = (args: {
    log: any;
    context: HandlerContext;
    configuration: Configuration;
    args: Args;
    render: Render;
}) => void | Promise<void>;

export interface FlushHookPlugin extends Plugin {
    type: "ps-flush-hook";
    beforeFlush?: HookCallbackFunction;
    afterFlush?: HookCallbackFunction;
}
