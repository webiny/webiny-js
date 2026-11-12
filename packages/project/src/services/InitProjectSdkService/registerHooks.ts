import { type IProjectModel } from "~/abstractions/models/index.js";
import { type IProjectConfigModel } from "~/abstractions/models/index.js";
import { Container } from "@webiny/di";
import { registerSrcExtensions } from "~/utils/index.js";
import {
    AdminAfterBuild as AdminAfterBuildExt,
    AdminBeforeBuild as AdminBeforeBuildExt,
    AdminBeforeWatch as AdminBeforeWatchExt,
    AfterBuild as AfterBuildExt,
    BeforeWatch as BeforeWatchExt,
    ApiAfterBuild as ApiAfterBuildExt,
    ApiBeforeBuild as ApiBeforeBuildExt,
    ApiBeforeWatch as ApiBeforeWatchExt,
    BeforeBuild as BeforeBuildExt,
    CoreAfterBuild as CoreAfterBuildExt,
    CoreBeforeBuild as CoreBeforeBuildExt,
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
        ...projectExtensions.extensionsByType(AdminBeforeBuildExt),
        ...projectExtensions.extensionsByType(AdminBeforeWatchExt),
        ...projectExtensions.extensionsByType(ApiBeforeBuildExt),
        ...projectExtensions.extensionsByType(ApiBeforeWatchExt),
        ...projectExtensions.extensionsByType(ApiAfterBuildExt),
        ...projectExtensions.extensionsByType(CoreBeforeBuildExt),
        ...projectExtensions.extensionsByType(CoreBeforeWatchExt),
        ...projectExtensions.extensionsByType(CoreAfterBuildExt)
    ];

    await registerSrcExtensions(container, hooksExtensions, project);
};
