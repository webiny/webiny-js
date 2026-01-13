import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { ExtensionMessage } from "~/services/InstallExtensionService/types.js";

export interface InstallExtensionParams {
    /**
     * The S3 source path of the extension to download.
     */
    source: string;

    /**
     * Callback to display progress messages.
     */
    onProgress?: (message: string) => void;

    /**
     * Callback when installation succeeds.
     */
    onSuccess?: (message: string) => void;

    /**
     * Callback when installation fails.
     */
    onError?: (message: string, error?: any) => void;
}

export interface InstallExtensionResult {
    success: boolean;
    extensionName?: string;
    extensionPaths?: string[];
    nextSteps?: ExtensionMessage[];
    additionalNotes?: ExtensionMessage[];
    error?: Error;
}

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
