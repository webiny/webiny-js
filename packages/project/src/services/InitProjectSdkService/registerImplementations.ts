import { type IProjectModel } from "~/abstractions/models/index.js";
import { type IProjectConfigModel } from "~/abstractions/models/index.js";
import { Container } from "@webiny/di";
import { SrcPathResolver } from "~/utils/index.js";
import { ProjectImplementation as ProjectImplementationExt } from "~/extensions/ProjectImplementation.js";

export const registerImplementations = async (
    container: Container,
    projectExtensions: IProjectConfigModel,
    project: IProjectModel
) => {
    const projectImplementations = [
        ...projectExtensions.extensionsByType(ProjectImplementationExt)
    ];

    for (const projectImplementation of projectImplementations) {
        const projectImplementationImpl = await SrcPathResolver.importFromPath(
            projectImplementation.params.src,
            project
        );
        const binding = container.register(projectImplementationImpl);

        // Apply singleton scope if specified (defaults to true)
        if (projectImplementation.params.singleton) {
            binding.inSingletonScope();
        }
    }
};
