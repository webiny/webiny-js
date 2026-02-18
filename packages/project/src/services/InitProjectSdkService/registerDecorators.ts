import { type IProjectModel } from "~/abstractions/models/index.js";
import { type IProjectConfigModel } from "~/abstractions/models/index.js";
import { Container } from "@webiny/di";
import { ExtensionSrcResolver } from "~/utils/index.js";
import { ProjectDecorator as ProjectDecoratorExt } from "~/extensions/ProjectDecorator.js";

export const registerDecorators = async (
    container: Container,
    projectExtensions: IProjectConfigModel,
    project: IProjectModel
) => {
    const projectDecorators = [...projectExtensions.extensionsByType(ProjectDecoratorExt)];

    for (const projectDecorator of projectDecorators) {
        const projectDecoratorImpl = await ExtensionSrcResolver.importFromPath(
            projectDecorator.params.src,
            project
        );
        container.registerDecorator(projectDecoratorImpl);
    }
};
