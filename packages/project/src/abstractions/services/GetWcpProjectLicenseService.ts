import { createAbstraction } from "~/abstractions/createAbstraction.js";
import type { EncryptedWcpProjectLicense } from "@webiny/wcp";

export interface IGetWcpProjectLicenseService {
    execute(): Promise<EncryptedWcpProjectLicense | null>;
}

export const GetWcpProjectLicenseService = createAbstraction<IGetWcpProjectLicenseService>(
    "GetWcpProjectLicenseService"
);

export namespace GetWcpProjectLicenseService {
    export type Interface = IGetWcpProjectLicenseService;
}
