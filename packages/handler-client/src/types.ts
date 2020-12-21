import HandlerClient from "./HandlerClient";
import { Plugin } from "@webiny/plugins/types";

export type InvokeArgs<TInvokeArgsPayload = any> = {
    name: string;
    payload?: TInvokeArgsPayload;
    await?: boolean;
};

export type HandlerClientPlugin = Plugin & {
    type: "handler-client";
    name: "handler-client";
    invoke: <TInvokeArgsPayload = Record<string, any>, TResponse = Record<string, any>>(
        params: InvokeArgs<TInvokeArgsPayload>
    ) => Promise<TResponse>;
};

export type ClientContext = {
    handlerClient: HandlerClient;
};
