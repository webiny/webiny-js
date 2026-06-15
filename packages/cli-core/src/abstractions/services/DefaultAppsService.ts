import { Abstraction } from "@webiny/di";

export interface IDefaultAppsService {
    execute(): Promise<string[]>;
}

export const DefaultAppsService = new Abstraction<IDefaultAppsService>("DefaultAppsService");

export namespace DefaultAppsService {
    export type Interface = IDefaultAppsService;
}
