import { IWebsocketManager } from "~/sockets/abstractions/IWebsocketManager";
import { IGenericData } from "~/sockets/abstractions/IWebsocketConnection";

export interface IWebsocketActions {
    manager: IWebsocketManager;
    action<T extends IGenericData = IGenericData, R extends IGenericData = IGenericData>(
        action: string,
        data: T,
        timeout?: number
    ): Promise<R | null>;
}
