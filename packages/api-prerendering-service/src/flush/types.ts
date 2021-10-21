import { HandlerPlugin as DefaultHandlerPlugin, Context } from "@webiny/handler/types";
import { DbRender } from "../types";
import { ArgsContext } from "@webiny/handler-args/types";
import { Plugin } from "@webiny/plugins/types";
import { DbContext } from "@webiny/handler-db/types";

export type Configuration = {
    website?: {
        url?: string;
    };
    db?: {
        namespace?: string;
    };
    meta?: Record<string, any>;
};

export type Args = {
    configuration?: Configuration;
    url?: string;
    path?: string;
};

export type HandlerArgs = Args | Args[];
export type HandlerContext = Context<DbContext, ArgsContext<HandlerArgs>>;
export type HandlerPlugin = DefaultHandlerPlugin<HandlerContext>;

export type HookCallbackFunction = (args: {
    log: any;
    context: HandlerContext;
    configuration: Configuration;
    args: Args;
    render: DbRender;
}) => void | Promise<void>;

export type FlushHookPlugin = Plugin<{
    type: "ps-flush-hook";
    beforeFlush?: HookCallbackFunction;
    afterFlush?: HookCallbackFunction;
}>;
