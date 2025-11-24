import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IProjectConfigModel } from "~/abstractions/models/index.js";

interface IValidateProjectConfig {
    execute(params: IProjectConfigModel): Promise<void>;
}

export const ValidateProjectConfig =
    createAbstraction<IValidateProjectConfig>("ValidateProjectConfig");

export namespace ValidateProjectConfig {
    export type Interface = IValidateProjectConfig;
    export type Params = IProjectConfigModel;
}
