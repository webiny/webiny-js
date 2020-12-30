import { HandlerPlugin as DefaultHandlerPlugin, Context } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { DbContext } from "@webiny/handler-db/types";
import { HandlerArgs as FlushArgs } from "./../../flush/types";
import { HandlerArgs as RenderArgs } from "./../../render/types";
import { Plugin } from "@webiny/plugins/types";

export type Args = {
    flush?: FlushArgs;
    render?: RenderArgs;
};

export type HandlerArgs = Args | Args[];
export type HandlerContext = Context<DbContext, ArgsContext<HandlerArgs>>;
export type HandlerPlugin = DefaultHandlerPlugin<HandlerContext>;

export type HookCallbackFunction = (args: {
    log: debug.Debugger;
    context: HandlerContext;
    args: Args;
}) => void | Promise<void>;

export type QueueAddHookPlugin = Plugin<{
    type: "ps-queue-add-hook";
    beforeAdd?: HookCallbackFunction;
    afterAdd?: HookCallbackFunction;
}>;
