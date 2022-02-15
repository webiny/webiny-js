import { HandlerPlugin as DefaultHandlerPlugin } from "@webiny/handler/types";
import { Plugin } from "@webiny/plugins/types";
import { ClientContext } from "@webiny/handler-client/types";

export type HandlerPlugin = DefaultHandlerPlugin<ClientContext>;

export interface HookCallbackFunctionParams {
    context: ClientContext;
}
export type HookCallbackFunction = (params: HookCallbackFunctionParams) => void | Promise<void>;

export interface ProcessHookPlugin extends Plugin {
    type: "ps-queue-process-hook";
    beforeProcess?: HookCallbackFunction;
    afterProcess?: HookCallbackFunction;
}
