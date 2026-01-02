import { BlueGreenDeployments as bgDeploymentsExt } from "~/pulumi/extensions/BlueGreenDeployments.js";
import { type IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";

export const getBgDeploymentsConfigFromExtension = (projectConfig: IProjectConfigModel) => {
    const [bgDeploymentsExtension] = projectConfig.extensionsByType(bgDeploymentsExt);
    if (!bgDeploymentsExtension) {
        return false;
    }

    return bgDeploymentsExtension.params;
};
