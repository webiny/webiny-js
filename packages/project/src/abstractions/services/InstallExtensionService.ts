import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { ExtensionMessage } from "~/services/InstallExtensionService/types.js";

export interface InstallExtensionResult {
    extensionName: string;
    extensionPaths: string[];
    nextSteps?: ExtensionMessage[];
    additionalNotes?: ExtensionMessage[];
}

export interface IInstallExtensionService {
    execute(source: string): Promise<InstallExtensionResult>;
}

export const InstallExtensionService =
    createAbstraction<IInstallExtensionService>("InstallExtensionService");

export namespace InstallExtensionService {
    export type Interface = IInstallExtensionService;
    export type Result = InstallExtensionResult;
}
