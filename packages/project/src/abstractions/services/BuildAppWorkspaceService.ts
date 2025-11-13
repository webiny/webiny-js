import { createAbstraction } from "~/abstractions/createAbstraction.js";
import type { IBaseAppParams } from "~/abstractions/types.ts";

export type IBuildAppWorkspaceServiceParams = IBaseAppParams;

export type IBuildResult = void;

export interface IBuildAppWorkspaceService {
    execute(params: IBuildAppWorkspaceServiceParams): Promise<IBuildResult>;
}

export const BuildAppWorkspaceService = createAbstraction<IBuildAppWorkspaceService>(
    "BuildAppWorkspaceService"
);

export namespace BuildAppWorkspaceService {
    export type Interface = IBuildAppWorkspaceService;
    export type Params = IBuildAppWorkspaceServiceParams;
    export type Result = IBuildResult;
}
