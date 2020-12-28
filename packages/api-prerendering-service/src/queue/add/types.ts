import { HandlerPlugin as DefaultHandlerPlugin, Context } from "@webiny/handler/types";
import { Plugin } from "@webiny/plugins/types";
import { DbContext } from "@webiny/handler-db/types";

export type Configuration = {
    website?: {
        url?: string;
    };
    storage?: {
        name?: string;
        folder?: string;
    };
    meta?: Record<string, any>;
};

export type Args = {
    configuration?: Configuration;
    url?: string;
    path?: string;
};

export type HandlerContext = Context<DbContext>;
export type HandlerPlugin = DefaultHandlerPlugin<HandlerContext>;

export type HookCallbackFunction = ({
    context: HandlerContext,
    configuration: Configuration,
    args: HandlerArgs
}) => void | Promise<void>;

export type addHookPlugin = Plugin<{
    type: "ps-queue-add-hook";
    beforeAdd?: HookCallbackFunction;
    afterAdd?: HookCallbackFunction;
}>;
