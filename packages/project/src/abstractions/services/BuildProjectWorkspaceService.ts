import { Abstraction } from "@webiny/di";

export type IBuildResult = void;

export interface IBuildProjectWorkspaceService {
    execute(): Promise<IBuildResult>;
}

export const BuildProjectWorkspaceService = new Abstraction<IBuildProjectWorkspaceService>(
    "BuildProjectWorkspaceService"
);

export namespace BuildProjectWorkspaceService {
    export type Interface = IBuildProjectWorkspaceService;
    export type Result = IBuildResult;
}
