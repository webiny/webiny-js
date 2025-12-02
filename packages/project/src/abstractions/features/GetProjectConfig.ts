import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IProjectConfigModel } from "~/abstractions/models/index.js";
import { type ExtensionTags } from "~/defineExtension/types.js";

interface IGetProjectConfigParams {
    tags?: ExtensionTags;
}

interface IGetProjectConfig {
    execute(params?: IGetProjectConfigParams): Promise<IProjectConfigModel>;
}

export const GetProjectConfig = createAbstraction<IGetProjectConfig>("GetProjectConfig");

export namespace GetProjectConfig {
    export type Interface = IGetProjectConfig;
    export type Params = IGetProjectConfigParams;
}
