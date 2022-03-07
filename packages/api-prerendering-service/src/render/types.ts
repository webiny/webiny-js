import { HandlerPlugin as DefaultHandlerPlugin, Context } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { Plugin } from "@webiny/plugins/types";
import {
    Args as BaseHandlerArgs,
    Args as BaseArgs,
    Configuration as BaseConfiguration
} from "~/types";

export type Configuration = BaseConfiguration;
export type Args = BaseArgs;

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

/**
 * @internal
 */
export interface RenderResult {
    content: string;
    meta: Record<string, any>;
}
/**
 * @internal
 */
export interface RenderUrlCallableParams {
    context: HandlerContext;
    args: BaseHandlerArgs;
    configuration: Configuration;
}
/**
 * @internal
 */
export interface RenderUrlParams extends RenderUrlCallableParams {
    renderUrlFunction?: (url: string, params: RenderUrlCallableParams) => Promise<RenderResult>;
}
/**
 * @internal
 */
export interface RenderUrlPostHtmlParams {
    render: RenderResult;
    args: RenderUrlParams;
    url: string;
    id: string;
    ts: number;
}
