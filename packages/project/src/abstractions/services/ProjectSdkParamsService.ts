import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type ExtensionDefinitionModel } from "~/defineExtension/models/ExtensionDefinitionModel.js";

export interface ILoggingParams {
    level?: "info" | "silent" | "fatal" | "error" | "warn" | "debug" | "trace";
    streamToStdout?: boolean;
}

export interface IProjectSdkParams {
    cwd: string;
    extensions: ExtensionDefinitionModel<any>[];
    logging: ILoggingParams;
    env: string;
    variant?: string;
    region?: string;
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
