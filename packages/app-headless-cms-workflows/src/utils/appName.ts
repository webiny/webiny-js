import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";

export const createAppName = (model: Pick<CmsModel, "modelId">): string => {
    return `cms.${model.modelId}`;
};


export const parseAppName = (appName: string): string => {
    const parts = appName.split(".");
    if (parts.length !== 2 || parts[0] !== "cms") {
        throw new Error(`Invalid app name: "${appName}".`);
    }
    return parts[1];
}
