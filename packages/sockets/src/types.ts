import { Context as BaseContext } from "@webiny/handler/types";
import { ISocketsContext } from "./context/abstractions/ISocketsContext";

export interface Context extends BaseContext {
    sockets: ISocketsContext;
}
