import handlerClient from "./plugins/handlerClient";
import handlerHttp from "./plugins/handlerHttp";
import handlerArgs from "./plugins/handlerArgs";
import { createHandler as createDefaultHandler } from "@webiny/handler";

export const createHandler = (...plugins) => {
    return createDefaultHandler(handlerClient, handlerArgs, handlerHttp, ...plugins);
};
