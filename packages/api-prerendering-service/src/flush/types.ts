import { HandlerPlugin as DefaultHandlerPlugin, Context } from "@webiny/handler/types";
import { Render, Args as BaseArgs, Configuration as BaseConfiguration } from "~/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { Plugin } from "@webiny/plugins/types";

export interface Args extends BaseArgs {}
export interface Configuration extends Omit<BaseConfiguration, "storage"> {}

export type HandlerArgs = Args | Args[];
export interface HandlerContext extends Context, ArgsContext<HandlerArgs> {
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
