import { createAbstraction } from "~/abstractions/createAbstraction.js";

export type UpgradeCommandPackageVersion = `${number}.${number}.${number}` | "latest";

export interface IUpgradeCommandHandlerHandleParams {
    showLogs: boolean;
    logLevel: string;
    showStackTrace: boolean;
    skipChecks: boolean;
    debug: boolean;
    version: UpgradeCommandPackageVersion;
}

export interface IUpgradeCommandHandler {
    handle(params: IUpgradeCommandHandlerHandleParams): Promise<void>;
}

export const UpgradeCommandHandler = createAbstraction<IUpgradeCommandHandler>(
    "Cli/Core/UpgradeCommandHandler"
);

export namespace UpgradeCommandHandler {
    export type Interface = IUpgradeCommandHandler;
    export type Params = IUpgradeCommandHandlerHandleParams;
    export type Version = UpgradeCommandPackageVersion;
}
