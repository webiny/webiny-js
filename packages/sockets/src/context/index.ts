import { ContextPlugin } from "@webiny/handler";
import { Context } from "~/types";
import { SocketsContext } from "./SocketsContext";

export const createSocketsContext = () => {
    return new ContextPlugin<Context>(async context => {
        context.sockets = new SocketsContext(context);
    });
};
