import { FlushEvent, PrerenderingSettings, Render } from "~/types";
import { Plugin } from "@webiny/plugins/types";
import { FastifyContext as Context } from "@webiny/fastify/types";

export type HandlerArgs = FlushEvent | FlushEvent[];

export interface HookCallbackFunction {
    (args: {
        log: (...args: string[]) => void;
        context: Context;
        render: Render;
        settings: PrerenderingSettings;
    }): void | Promise<void>;
}

export interface FlushHookPlugin extends Plugin {
    type: "ps-flush-hook";
    beforeFlush?: HookCallbackFunction;
    afterFlush?: HookCallbackFunction;
}
