import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { IUrlModel, IWcpUserModel, IWcpUserPatModel } from "~/abstractions/models/index.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types";

export interface IGetProjectEnvironmentParams {
    orgId?: string;
    projectId?: string;
    userId?: string;
    environmentId?: string;
    apiKey?: string;
}

export interface IGetProjectLicenseParams {
    apiKey: string;
    orgId: string;
    projectId: string;
}

export interface IWcpService {
    getUser(): Promise<IWcpUserModel | null>;

    generateUserPat(): Promise<string>;

    getUserPat(pat: string): Promise<IWcpUserPatModel | null>;

    createUserPat(patData: any, userPat: string): Promise<IWcpUserPatModel | null>;

    storePatToLocalStorage(pat: string): void;

    unsetPatFromLocalStorage(): void;

    getWcpApiUrl(): IUrlModel;

    getWcpGqlApiUrl(): IUrlModel;

    getWcpAppUrl(): IUrlModel;

    getProjectEnvironment(params: IGetProjectEnvironmentParams): Promise<any>;

    getProjectLicense(params: IGetProjectLicenseParams): Promise<DecryptedWcpProjectLicense | null>;
}

export const WcpService = createAbstraction<IWcpService>("WcpService");

export namespace WcpService {
    export type Interface = IWcpService;
}
