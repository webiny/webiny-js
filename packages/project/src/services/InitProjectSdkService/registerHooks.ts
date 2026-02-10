import { type IProjectModel } from "~/abstractions/models/index.js";
import { type IProjectConfigModel } from "~/abstractions/models/index.js";
import { Container } from "@webiny/di";
import { ImplPathResolver } from "~/utils/index.js";
import {
    AdminAfterBuild as AdminAfterBuildExt,
    AdminAfterDeploy as AdminAfterDeployExt,
    AdminBeforeBuild as AdminBeforeBuildExt,
    AdminBeforeDeploy as AdminBeforeDeployExt,
    AdminBeforeWatch as AdminBeforeWatchExt,
    AfterBuild as AfterBuildExt,
    BeforeWatch as BeforeWatchExt,
    ApiAfterBuild as ApiAfterBuildExt,
    ApiAfterDeploy as ApiAfterDeployExt,
    ApiBeforeBuild as ApiBeforeBuildExt,
    ApiBeforeDeploy as ApiBeforeDeployExt,
    ApiBeforeWatch as ApiBeforeWatchExt,
    BeforeBuild as BeforeBuildExt,
    BeforeDeploy as BeforeDeployExt,
    AfterDeploy as AfterDeployExt,
    CoreAfterBuild as CoreAfterBuildExt,
    CoreAfterDeploy as CoreAfterDeployExt,
    CoreBeforeBuild as CoreBeforeBuildExt,
    CoreBeforeDeploy as CoreBeforeDeployExt,
    CoreBeforeWatch as CoreBeforeWatchExt
} from "~/extensions/hooks/index.js";

export const registerHooks = async (
    container: Container,
    projectExtensions: IProjectConfigModel,
    project: IProjectModel
) => {
    const hooksExtensions = [
        ...projectExtensions.extensionsByType(AdminAfterBuildExt),
        ...projectExtensions.extensionsByType(BeforeBuildExt),
        ...projectExtensions.extensionsByType(BeforeWatchExt),
        ...projectExtensions.extensionsByType(AfterBuildExt),
        ...projectExtensions.extensionsByType(BeforeDeployExt),
        ...projectExtensions.extensionsByType(AfterDeployExt),
        ...projectExtensions.extensionsByType(AdminBeforeBuildExt),
        ...projectExtensions.extensionsByType(AdminBeforeDeployExt),
        ...projectExtensions.extensionsByType(AdminBeforeWatchExt),
        ...projectExtensions.extensionsByType(AdminAfterBuildExt),
        ...projectExtensions.extensionsByType(AdminAfterDeployExt),
        ...projectExtensions.extensionsByType(ApiBeforeBuildExt),
        ...projectExtensions.extensionsByType(ApiBeforeDeployExt),
        ...projectExtensions.extensionsByType(ApiBeforeWatchExt),
        ...projectExtensions.extensionsByType(ApiAfterBuildExt),
        ...projectExtensions.extensionsByType(ApiAfterDeployExt),
        ...projectExtensions.extensionsByType(CoreBeforeBuildExt),
        ...projectExtensions.extensionsByType(CoreBeforeDeployExt),
        ...projectExtensions.extensionsByType(CoreBeforeWatchExt),
        ...projectExtensions.extensionsByType(CoreAfterBuildExt),
        ...projectExtensions.extensionsByType(CoreAfterDeployExt)
    ];

    for (const hookExtension of hooksExtensions) {
        const hookImpl = await ImplPathResolver.importFromPath(hookExtension.params.src, project);
        container.register(hookImpl).inSingletonScope();
    }
};
