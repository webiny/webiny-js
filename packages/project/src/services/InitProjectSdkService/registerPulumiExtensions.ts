import { type IProjectModel } from "~/abstractions/models/index.js";
import { type IProjectConfigModel } from "~/abstractions/models/index.js";
import { Container } from "@webiny/di";
import { ExtensionSrcResolver } from "~/utils/index.js";

export const registerPulumiExtensions = async (
    container: Container,
    projectExtensions: IProjectConfigModel,
    project: IProjectModel
) => {
    const pulumiExtensions = [
        ...projectExtensions.extensionsByType("Core/Pulumi"),
        ...projectExtensions.extensionsByType("Api/Pulumi"),
        ...projectExtensions.extensionsByType("Admin/Pulumi")
    ];

    for (const pulumiExtension of pulumiExtensions) {
        const { src } = pulumiExtension.params as { src: string };
        const pulumiImpl = await ExtensionSrcResolver.importFromPath(src, project);
        container.register(pulumiImpl).inSingletonScope();
    }
};
