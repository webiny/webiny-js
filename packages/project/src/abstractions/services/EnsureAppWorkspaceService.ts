import { Abstraction } from "@webiny/di-container";
import type { IBaseAppParams } from "~/abstractions/types.ts";

export type IEnsureAppWorkspaceServiceParams = IBaseAppParams;

export type IBuildResult = void;

export interface IEnsureAppWorkspaceService {
    execute(params: IEnsureAppWorkspaceServiceParams): Promise<IBuildResult>;
}

export const EnsureAppWorkspaceService = new Abstraction<IEnsureAppWorkspaceService>(
    "EnsureAppWorkspaceService"
);

export namespace EnsureAppWorkspaceService {
    export type Interface = IEnsureAppWorkspaceService;
    export type Params = IEnsureAppWorkspaceServiceParams;
    export type Result = IBuildResult;
}
