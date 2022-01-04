import { HandlerPlugin as DefaultHandlerPlugin } from "@webiny/handler/types";
import { Plugin } from "@webiny/plugins/types";
import { ClientContext } from "@webiny/handler-client/types";

export type HandlerPlugin = DefaultHandlerPlugin<ClientContext>;

export type HookCallbackFunction = ({ context: ClientContext }) => void | Promise<void>;

export interface ProcessHookPlugin extends Plugin {
    type: "ps-queue-process-hook";
    beforeProcess?: HookCallbackFunction;
    afterProcess?: HookCallbackFunction;
}
