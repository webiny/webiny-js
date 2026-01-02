import { createAbstraction } from "~/abstractions/createAbstraction.js";
import type { AppName } from "~/abstractions/types.ts";

export type IBuildAppWorkspaceServiceOptions = {
    forceRebuild?: boolean;
};

export type IBuildResult = void;

export interface IBuildAppWorkspaceService {
    execute(appName: AppName, options?: IBuildAppWorkspaceServiceOptions): Promise<IBuildResult>;
}

export const BuildAppWorkspaceService = createAbstraction<IBuildAppWorkspaceService>(
    "BuildAppWorkspaceService"
);

export namespace BuildAppWorkspaceService {
    export type Interface = IBuildAppWorkspaceService;
    export type Options = IBuildAppWorkspaceServiceOptions;
    export type Result = IBuildResult;
}
