import type { ILicense, WcpProject } from "@webiny/wcp/types.js";
import { IWcpContext } from "./abstractions.js";

export type WcpContextObject = IWcpContext;

export interface CachedWcpProjectLicense {
    cacheKey: string | null;
    project: WcpProject | null;
    license: ILicense;
}

export type AaclPermission = {
    name: "aacl";
    legacy: boolean;
    teams: boolean;
};
