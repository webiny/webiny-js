import { ApiLambdaFunction as apiLambdaFunctionExt } from "~/pulumi/extensions/ApiLambdaFunction.js";
import { type IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";

export const getApiLambdaFunctionConfigFromExtension = (projectConfig: IProjectConfigModel) => {
    const [apiLambdaFunctionExtension] = projectConfig.extensionsByType(apiLambdaFunctionExt);
    if (!apiLambdaFunctionExtension) {
        return undefined;
    }

    return apiLambdaFunctionExtension.params;
};
