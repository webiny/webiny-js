import { createAbstraction } from "@webiny/feature/api";
import type { IWebsocketsContextObject } from "~/context/abstractions/IWebsocketsContext.js";
import {
    WebsocketForceDisconnectError,
    WebsocketForceDisconnectNotificationError,
    type WebsocketServiceError
} from "~/features/WebsocketService/errors.js";
import type { IWebsocketsConnectionRegistryData } from "~/registry/index.js";

export const WebsocketService = createAbstraction<IWebsocketsContextObject>("WebsocketService");

export namespace WebsocketService {
    export type Interface = IWebsocketsContextObject;
    export type Connection = IWebsocketsConnectionRegistryData;
    export type Error =
        | WebsocketServiceError
        | WebsocketForceDisconnectNotificationError
        | WebsocketForceDisconnectError;
}
