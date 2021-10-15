import { HandlerPlugin as DefaultHandlerPlugin, ContextInterface } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { Args as FlushArgs } from "~/flush/types";
import { Args as RenderArgs } from "~/render/types";
import { Plugin } from "@webiny/plugins/types";

export interface Tag {
    key: string;
    value?: string;
}

export interface QueueArgs {
    tag?: Tag;
}

export interface Args {
    flush?: FlushArgs & QueueArgs;
    render?: RenderArgs & QueueArgs;
}

export type HandlerArgs = Args | Args[];
export interface HandlerContext extends ContextInterface, ArgsContext<HandlerArgs> {
    //
}
export type HandlerPlugin = DefaultHandlerPlugin<HandlerContext>;

export type HookCallbackFunction = (args: {
    log: any;
    context: HandlerContext;
    args: Args;
}) => void | Promise<void>;

export interface QueueAddHookPlugin extends Plugin {
    type: "ps-queue-add-hook";
    beforeAdd?: HookCallbackFunction;
    afterAdd?: HookCallbackFunction;
}
