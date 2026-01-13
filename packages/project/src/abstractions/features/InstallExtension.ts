import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { InstallExtensionService } from "../services/index.js";

interface IInstallExtension {
    execute(source: string): Promise<InstallExtensionService.Result>;
}

export const InstallExtension = createAbstraction<IInstallExtension>("InstallExtension");

export namespace InstallExtension {
    export type Interface = IInstallExtension;
    export type Result = InstallExtensionService.Result;
}
