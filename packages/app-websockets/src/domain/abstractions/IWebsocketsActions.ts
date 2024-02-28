import { IWebsocketsManager } from "./IWebsocketsManager";
import { IGenericData } from "./types";

export interface IWebsocketsActionsRunParams<T extends IGenericData = IGenericData> {
    action: string;
    data?: T;
    timeout?: number;
}

export interface IWebsocketsActions {
    manager: IWebsocketsManager;
    run<T extends IGenericData = IGenericData, R extends IGenericData = IGenericData>(
        params: IWebsocketsActionsRunParams<T>
    ): Promise<R | null>;
}
