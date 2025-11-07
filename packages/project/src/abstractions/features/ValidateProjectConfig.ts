import { Abstraction } from "@webiny/di";
import { type IProjectConfigModel } from "~/abstractions/models/index.js";

interface IValidateProjectConfig {
    execute(params: IProjectConfigModel): Promise<void>;
}

export const ValidateProjectConfig = new Abstraction<IValidateProjectConfig>(
    "ValidateProjectConfig"
);

export namespace ValidateProjectConfig {
    export type Interface = IValidateProjectConfig;
    export type Params = IProjectConfigModel;
}
