import { createAbstraction } from "@webiny/feature/api";
import type { IWebsocketsConnectionRegistry } from "~/registry/abstractions/IWebsocketsConnectionRegistry.js";

export const ConnectionRegistry =
    createAbstraction<IWebsocketsConnectionRegistry>("ConnectionRegistry");

export namespace ConnectionRegistry {
    export type Interface = IWebsocketsConnectionRegistry;
}
