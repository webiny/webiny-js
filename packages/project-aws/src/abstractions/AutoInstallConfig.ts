import { createAbstraction } from "@webiny/project/abstractions/createAbstraction";

export interface IAutoInstallConfigAdminUser {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface IAutoInstallConfig {
    enabled: boolean;
    adminUser?: IAutoInstallConfigAdminUser;
}

export interface IAutoInstallConfigService {
    getConfig(): IAutoInstallConfig;
}

export const AutoInstallConfig = createAbstraction<IAutoInstallConfigService>("AutoInstallConfig");

export namespace AutoInstallConfig {
    export type Interface = IAutoInstallConfigService;
    export type Config = IAutoInstallConfig;
    export type AdminUser = IAutoInstallConfigAdminUser;
}
