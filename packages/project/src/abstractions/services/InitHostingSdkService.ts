import { Container } from "@webiny/di";
import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IProjectConfigModel } from "~/abstractions/models/index.js";
import { type IProjectModel } from "~/abstractions/models/index.js";

export interface IInitHostingSdkServiceParams {
    container: Container;
    projectExtensions: IProjectConfigModel;
    project: IProjectModel;
}

/**
 * Lets a hosting package register what it needs once the project config is loaded, such as
 * implementations named in the config or decorators of its own features. `InitProjectSdkService`
 * runs every registered one after the config hooks and before the built-in decorators.
 */
export interface IInitHostingSdkService {
    execute(params: IInitHostingSdkServiceParams): Promise<void>;
}

export const InitHostingSdkService =
    createAbstraction<IInitHostingSdkService>("InitHostingSdkService");

export namespace InitHostingSdkService {
    export type Interface = IInitHostingSdkService;
    export type Params = IInitHostingSdkServiceParams;
}
