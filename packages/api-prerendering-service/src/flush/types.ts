import { Context } from "@webiny/handler/types";
import { FlushEvent, PrerenderingSettings, Render } from "~/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { Plugin } from "@webiny/plugins/types";

export type HandlerArgs = FlushEvent | FlushEvent[];

export interface HandlerContext extends Context, ArgsContext<HandlerArgs> {}

export interface HookCallbackFunction {
    (args: {
        log: (...args: string[]) => void;
        context: HandlerContext;
        render: Render;
        settings: PrerenderingSettings;
    }): void | Promise<void>;
}

export interface FlushHookPlugin extends Plugin {
    type: "ps-flush-hook";
    beforeFlush?: HookCallbackFunction;
    afterFlush?: HookCallbackFunction;
}
