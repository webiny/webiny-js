import HandlerClient from "./HandlerClient";
import { Plugin } from "@webiny/plugins/types";
import { Context } from "@webiny/api/types";

export type InvokeArgs<TInvokeArgsPayload = any> = {
    name: string;
    payload?: TInvokeArgsPayload;
    await?: boolean;
};

export type HandlerClientPlugin = Plugin & {
    type: "handler-client";
    name: "handler-client";
    invoke: <TInvokeArgsPayload = Record<string, any>>(
        params: InvokeArgs<TInvokeArgsPayload>
    ) => any;
};

export type HandlerClientHandlerPlugin = Plugin & {
    type: "handler-client-handler";
    invoke: <TArgs = Record<string, any>, TResponse = Record<string, any>>(
        params: TArgs
    ) => TResponse | Promise<TResponse>;
};

export interface ClientContext extends Context {
    handlerClient: HandlerClient;
}
