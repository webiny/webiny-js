import { HandlerPlugin as DefaultHandlerPlugin, ContextInterface } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { Plugin } from "@webiny/plugins/types";

export interface Configuration {
    website?: {
        url?: string;
    };
    db?: {
        namespace?: string;
    };
    storage?: {
        name?: string;
        folder?: string;
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
    context: HandlerContext;
    configuration: Configuration;
    args: Args;
}) => void | Promise<void>;

export interface RenderHookPlugin extends Plugin {
    type: "ps-render-hook";
    beforeRender?: HookCallbackFunction;
    afterRender?: HookCallbackFunction;
}
