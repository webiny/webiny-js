import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IProjectConfigModel } from "~/abstractions/models/index.js";
import { type ExtensionTags } from "~/defineExtension/types.js";

interface IGetProjectConfigServiceParams {
    tags?: ExtensionTags;
    renderArgs?: Record<string, any>;
}

type IGetProjectConfigServiceResult = IProjectConfigModel;

interface IGetProjectConfigService {
    execute(params?: IGetProjectConfigServiceParams): Promise<IGetProjectConfigServiceResult>;
}

export const GetProjectConfigService = createAbstraction<IGetProjectConfigService>(
    "GetProjectConfigService"
);

export namespace GetProjectConfigService {
    export type Interface = IGetProjectConfigService;
    export type Params = IGetProjectConfigServiceParams;
    export type Result = IGetProjectConfigServiceResult;
}
