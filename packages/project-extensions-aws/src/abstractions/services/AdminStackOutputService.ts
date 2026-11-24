import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";

export interface IAdminStackOutput {
    region?: string;
    appUrl?: string;
    [key: string]: any;
}

export interface IAdminStackOutputService {
    execute<TOutput extends IAdminStackOutput = IAdminStackOutput>(): Promise<TOutput | null>;
}

export const AdminStackOutputService =
    createAbstraction<IAdminStackOutputService>("AdminStackOutputService");

export namespace AdminStackOutputService {
    export type Interface = IAdminStackOutputService;
    export type Output = IAdminStackOutput;
}
