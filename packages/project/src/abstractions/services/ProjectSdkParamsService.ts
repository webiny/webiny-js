import { createAbstraction } from "~/abstractions/createAbstraction.js";

export interface ILoggingParams {
    level?: "info" | "silent" | "fatal" | "error" | "warn" | "debug" | "trace";
    streamToStdout?: boolean;
}

export interface IProjectSdkParams {
    cwd: string;
    logging?: ILoggingParams;
}

export interface IProjectSdkParamsService {
    get(): IProjectSdkParams;
    set(params: Partial<IProjectSdkParams>): void;
}

export const ProjectSdkParamsService =
    createAbstraction<IProjectSdkParamsService>("ProjectSdkParamsService");

export namespace ProjectSdkParamsService {
    export type Interface = IProjectSdkParamsService;
    export type Params = IProjectSdkParams;
}
