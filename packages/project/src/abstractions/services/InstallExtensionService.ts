import { createAbstraction } from "~/abstractions/createAbstraction.js";
import {
    InstallExtensionParams,
    InstallExtensionResult
} from "~/services/InstallExtensionService/types.js";

export interface IInstallExtensionService {
    execute(params: InstallExtensionParams): Promise<InstallExtensionResult>;
}

export const InstallExtensionService =
    createAbstraction<IInstallExtensionService>("InstallExtensionService");

export namespace InstallExtensionService {
    export type Interface = IInstallExtensionService;
    export type Params = InstallExtensionParams;
    export type Result = InstallExtensionResult;
}
