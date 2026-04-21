import { createAbstraction } from "@webiny/feature/admin";
import type { Webiny } from "@webiny/sdk";

// The WebinySdk abstraction wraps the Webiny SDK instance.
// Gateways inject this to call sdk.fileManager.*, sdk.cms.*, etc.
export type IWebinySdk = Webiny;

export const WebinySdk = createAbstraction<IWebinySdk>("WebinySdk");

export namespace WebinySdk {
    export type Interface = IWebinySdk;
}
