import { ApiWebFunction } from "~/extensions/ApiWebFunction.js";
import { type IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";

/**
 * On unless the project sets `<Infra.Api.WebFunction enabled={false} />`.
 */
export const isWebFunctionEnabled = (projectConfig: IProjectConfigModel): boolean => {
    const [webFunctionExtension] = projectConfig.extensionsByType(ApiWebFunction);
    if (!webFunctionExtension) {
        return true;
    }
    return webFunctionExtension.params.enabled !== false;
};
