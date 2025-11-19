import { createAbstraction } from "@webiny/feature/api";
import type { IWebsocketsContextObject } from "~/context/abstractions/IWebsocketsContext.js";

export const WebsocketsContext = createAbstraction<IWebsocketsContextObject>("WebsocketsContext");

export namespace WebsocketsContext {
    export type Interface = IWebsocketsContextObject;
}
