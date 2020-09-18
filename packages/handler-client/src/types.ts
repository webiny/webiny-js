import HandlerClient from "./HandlerClient";

export type InvokeParams = { name: string; payload?: { [key: string]: any }; await?: boolean };
export type InvokeResult = { [key: string]: any };

export type HandlerClientPlugin = Plugin & {
    type: "handler-client";
    name: "handler-client";
    invoke: (params: InvokeParams) => InvokeResult;
};

export type HandlerClientContext = {
    handlerClient: HandlerClient;
};
