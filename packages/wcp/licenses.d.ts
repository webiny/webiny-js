import { DecryptedWcpProjectLicense } from "./types";
export interface GetWcpProjectLicenseParams {
    orgId: string;
    projectId: string;
    projectEnvironmentApiKey: string;
}
export declare const getWcpProjectLicense: (params: GetWcpProjectLicenseParams) => Promise<DecryptedWcpProjectLicense | null>;
export {};
