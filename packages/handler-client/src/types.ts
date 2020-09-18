import HandlerClient from "./HandlerClient";
import { Plugin } from "@webiny/plugins/types";

export type InvokeParams = { name: string; payload?: { [key: string]: any }; await?: boolean };
export type InvokeResult = { [key: string]: any };

export type HandlerClientPlugin = Plugin & {
    type: "handler-client";
    name: "handler-client";
    invoke: (params: InvokeParams) => Promise<InvokeResult>;
};

export type HandlerClientContext = {
    handlerClient: HandlerClient;
};
