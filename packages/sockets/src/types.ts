import { Context as BaseContext } from "@webiny/handler/types";
import { DbContext } from "@webiny/handler-db/types";
import { ISocketsContext } from "./context/abstractions/ISocketsContext";

export interface Context extends BaseContext, DbContext {
    sockets: ISocketsContext;
}
