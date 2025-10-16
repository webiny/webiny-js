import type { WcpContextObject } from "@webiny/api-wcp/types.js";

export interface IGetWcpGateway {
    execute: () => WcpContextObject;
}
