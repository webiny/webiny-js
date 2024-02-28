import { IWebsocketManager } from "./IWebsocketManager";
import { IGenericData } from "./IWebsocketConnection";

export interface IWebsocketActionsRunParams<T extends IGenericData = IGenericData> {
    action: string;
    data?: T;
    timeout?: number;
}

export interface IWebsocketActions {
    manager: IWebsocketManager;
    run<T extends IGenericData = IGenericData, R extends IGenericData = IGenericData>(
        params: IWebsocketActionsRunParams<T>
    ): Promise<R | null>;
}
