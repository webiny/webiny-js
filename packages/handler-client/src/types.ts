import HandlerClient from "./HandlerClient";
import { Plugin } from "@webiny/plugins/types";

export type InvokeArgs = { name: string; payload?: { [key: string]: any }; await?: boolean };
export type InvokeResult = { [key: string]: any };

export type HandlerClientPlugin = Plugin & {
    type: "handler-client";
    name: "handler-client";
    invoke: <T = InvokeResult>(params: InvokeArgs) => Promise<T>;
};

export type ClientContext = {
    handlerClient: HandlerClient;
};
