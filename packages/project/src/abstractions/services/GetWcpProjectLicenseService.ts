import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IWcpProjectLicense {
    // Add license fields as needed based on the actual license response
    [key: string]: any;
}

export interface IGetWcpProjectLicenseService {
    execute(): Promise<IWcpProjectLicense | null>;
}

export const GetWcpProjectLicenseService = createAbstraction<IGetWcpProjectLicenseService>("GetWcpProjectLicenseService");

export namespace GetWcpProjectLicenseService {
    export type Interface = IGetWcpProjectLicenseService;
}
