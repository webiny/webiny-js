import { createAbstraction } from "@webiny/feature/api";
import type { IWebsocketsTransport } from "~/transport/abstractions/IWebsocketsTransport.js";

export const Transport = createAbstraction<IWebsocketsTransport>("WebsocketsTransport");

export namespace Transport {
    export type Interface = IWebsocketsTransport;
}
