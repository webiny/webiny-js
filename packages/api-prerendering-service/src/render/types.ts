import { HandlerPlugin as DefaultHandlerPlugin, Context } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { Plugin } from "@webiny/plugins/types";
import { DbContext } from "@webiny/handler-db/types";
import debug from "debug";

export type Configuration = {
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
};

export type Tag = { key: string; value?: string };

export type Args = {
    queue?: boolean;
    configuration?: Configuration;
    url?: string;
    path?: string;

    // Can only be used when adding a new rendering queue job.
    tag?: Tag;
};

export type HandlerArgs = Args | Args[];
export type HandlerContext = Context<DbContext, ArgsContext<HandlerArgs>>;
export type HandlerPlugin = DefaultHandlerPlugin<HandlerContext>;

export type HookCallbackFunction = (args: {
    log: debug.Debugger;
    context: HandlerContext;
    configuration: Configuration;
    args: Args;
}) => void | Promise<void>;

export type RenderHookPlugin = Plugin<{
    type: "ps-render-hook";
    beforeRender?: HookCallbackFunction;
    afterRender?: HookCallbackFunction;
}>;
