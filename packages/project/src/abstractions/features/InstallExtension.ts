import { createAbstraction } from "~/abstractions/createAbstraction.js";
import {
    InstallExtensionParams,
    InstallExtensionResult
} from "~/services/InstallExtensionService/types.js";

interface IInstallExtension {
    execute(params: InstallExtensionParams): Promise<InstallExtensionResult>;
}

export const InstallExtension = createAbstraction<IInstallExtension>("InstallExtension");

export namespace InstallExtension {
    export type Interface = IInstallExtension;
    export type Params = InstallExtensionParams;
    export type Result = InstallExtensionResult;
}
