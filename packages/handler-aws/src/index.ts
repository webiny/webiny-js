import defaultHandlerClient from "@webiny/handler-client";
import defaultHandlerHttp from "@webiny/handler-http";
import defaultHandlerArgs from "@webiny/handler-args";
import handlerClient from "./plugins/handlerClient";
import handlerHttp from "./plugins/handlerHttp";
import handlerArgs from "./plugins/handlerArgs";
import { createHandler as createDefaultHandler } from "@webiny/handler";

export const createHandler = (...plugins) => {
    return createDefaultHandler(
        defaultHandlerClient(),
        defaultHandlerHttp(),
        defaultHandlerArgs(),
        handlerClient,
        handlerArgs,
        handlerHttp,
        ...plugins
    );
};
