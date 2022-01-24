import { HandlerPlugin as DefaultHandlerPlugin, Context } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { Plugin } from "@webiny/plugins/types";
import { Args as BaseArgs, Configuration as BaseConfiguration } from "~/types";

export interface Configuration extends BaseConfiguration {}
export interface Args extends BaseArgs {}

export type HandlerArgs = Args | Args[];
export interface HandlerContext extends Context, ArgsContext<HandlerArgs> {
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
