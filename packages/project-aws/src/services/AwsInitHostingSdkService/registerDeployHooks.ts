import { type IProjectModel } from "@webiny/project/abstractions/models/index.js";
import { type IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";
import { Container } from "@webiny/di";
import { ExtensionSrcResolver } from "@webiny/project/utils/index.js";
import { AdminAfterDeploy } from "@webiny/project-extensions-aws/extensions/hooks/AdminAfterDeploy.js";
import { AdminBeforeDeploy } from "@webiny/project-extensions-aws/extensions/hooks/AdminBeforeDeploy.js";
import { AfterDeploy } from "@webiny/project-extensions-aws/extensions/hooks/AfterDeploy.js";
import { ApiAfterDeploy } from "@webiny/project-extensions-aws/extensions/hooks/ApiAfterDeploy.js";
import { ApiBeforeDeploy } from "@webiny/project-extensions-aws/extensions/hooks/ApiBeforeDeploy.js";
import { BeforeDeploy } from "@webiny/project-extensions-aws/extensions/hooks/BeforeDeploy.js";
import { CoreAfterDeploy } from "@webiny/project-extensions-aws/extensions/hooks/CoreAfterDeploy.js";
import { CoreBeforeDeploy } from "@webiny/project-extensions-aws/extensions/hooks/CoreBeforeDeploy.js";

export const registerDeployHooks = async (
    container: Container,
    projectExtensions: IProjectConfigModel,
    project: IProjectModel
) => {
    const hooksExtensions = [
        ...projectExtensions.extensionsByType(BeforeDeploy),
        ...projectExtensions.extensionsByType(AfterDeploy),
        ...projectExtensions.extensionsByType(AdminBeforeDeploy),
        ...projectExtensions.extensionsByType(AdminAfterDeploy),
        ...projectExtensions.extensionsByType(ApiBeforeDeploy),
        ...projectExtensions.extensionsByType(ApiAfterDeploy),
        ...projectExtensions.extensionsByType(CoreBeforeDeploy),
        ...projectExtensions.extensionsByType(CoreAfterDeploy)
    ];

    for (const hookExtension of hooksExtensions) {
        const hookImpl = await ExtensionSrcResolver.importFromPath(
            hookExtension.params.src,
            project
        );
        container.register(hookImpl).inSingletonScope();
    }
};
