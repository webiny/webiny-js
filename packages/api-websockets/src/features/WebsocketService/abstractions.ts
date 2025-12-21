import { createAbstraction } from "@webiny/feature/api";
import type { IWebsocketsContextObject } from "~/context/abstractions/IWebsocketsContext.js";

export const WebsocketService = createAbstraction<IWebsocketsContextObject>("WebsocketService");

export namespace WebsocketService {
    export type Interface = IWebsocketsContextObject;
}
