import { HandlerPlugin as DefaultHandlerPlugin, Context } from "@webiny/handler/types";
import { Plugin } from "@webiny/plugins/types";
import { DbContext } from "@webiny/handler-db/types";
import { ClientContext } from "@webiny/handler-client/types";

export type HandlerContext = Context<DbContext, ClientContext>;
export type HandlerPlugin = DefaultHandlerPlugin<HandlerContext>;

export type HookCallbackFunction = ({ context: HandlerContext }) => void | Promise<void>;

export type ProcessHookPlugin = Plugin<{
    type: "ps-queue-process-hook";
    beforeProcess?: HookCallbackFunction;
    afterProcess?: HookCallbackFunction;
}>;
