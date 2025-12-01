import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IProjectConfigModel } from "~/abstractions/models/index.js";

interface IValidateProjectConfigService {
    execute(projectConfig: IProjectConfigModel): Promise<void>;
}

export const ValidateProjectConfigService = createAbstraction<IValidateProjectConfigService>(
    "ValidateProjectConfigService"
);

export namespace ValidateProjectConfigService {
    export type Interface = IValidateProjectConfigService;
    export type Params = IProjectConfigModel;
}
