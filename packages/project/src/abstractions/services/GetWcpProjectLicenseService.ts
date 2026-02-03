import { createAbstraction } from "~/abstractions/createAbstraction.js";

/**
 * WCP Project License interface.
 * The license structure is dynamic and may contain different fields depending on the license type.
 * This interface uses a catch-all signature to accommodate the variability in license data.
 */
export interface IWcpProjectLicense {
    [key: string]: any;
}

export interface IGetWcpProjectLicenseService {
    execute(): Promise<IWcpProjectLicense | null>;
}

export const GetWcpProjectLicenseService = createAbstraction<IGetWcpProjectLicenseService>("GetWcpProjectLicenseService");

export namespace GetWcpProjectLicenseService {
    export type Interface = IGetWcpProjectLicenseService;
}
