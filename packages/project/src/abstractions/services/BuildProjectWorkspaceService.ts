import { createAbstraction } from "~/abstractions/createAbstraction.js";

export type IBuildResult = void;

export interface IBuildProjectWorkspaceService {
    execute(): Promise<IBuildResult>;
}

export const BuildProjectWorkspaceService = createAbstraction<IBuildProjectWorkspaceService>(
    "BuildProjectWorkspaceService"
);

export namespace BuildProjectWorkspaceService {
    export type Interface = IBuildProjectWorkspaceService;
    export type Result = IBuildResult;
}
