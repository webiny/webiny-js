import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface IUpgradeCommandHandlerHandleParams {
    _: [string, string | undefined];
    showLogs: boolean;
    logLevel: string;
    showStackTrace: false;
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
}
