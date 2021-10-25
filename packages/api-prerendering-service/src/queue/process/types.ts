import { ContextInterface, HandlerPlugin as DefaultHandlerPlugin } from "@webiny/handler/types";
import { Plugin } from "@webiny/plugins/types";
import { ClientContext } from "@webiny/handler-client/types";

export interface HandlerContext extends ContextInterface, ClientContext {
    //
}
export type HandlerPlugin = DefaultHandlerPlugin<HandlerContext>;

export type HookCallbackFunction = ({ context: HandlerContext }) => void | Promise<void>;

export interface ProcessHookPlugin extends Plugin {
    type: "ps-queue-process-hook";
    beforeProcess?: HookCallbackFunction;
    afterProcess?: HookCallbackFunction;
}
