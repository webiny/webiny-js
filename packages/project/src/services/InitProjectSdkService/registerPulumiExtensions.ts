import { type IProjectModel } from "~/abstractions/models/index.js";
import { type IProjectConfigModel } from "~/abstractions/models/index.js";
import { Container } from "@webiny/di";
import { ExtensionSrcResolver } from "~/utils/index.js";
import {
    CorePulumi as CorePulumiExt,
    ApiPulumi as ApiPulumiExt,
    AdminPulumi as AdminPulumiExt
} from "~/extensions/pulumi/index.js";

export const registerPulumiExtensions = async (
    container: Container,
    projectExtensions: IProjectConfigModel,
    project: IProjectModel
) => {
    const pulumiExtensions = [
        ...projectExtensions.extensionsByType(CorePulumiExt),
        ...projectExtensions.extensionsByType(ApiPulumiExt),
        ...projectExtensions.extensionsByType(AdminPulumiExt)
    ];

    for (const pulumiExtension of pulumiExtensions) {
        const pulumiImpl = await ExtensionSrcResolver.importFromPath(
            pulumiExtension.params.src,
            project
        );
        container.register(pulumiImpl).inSingletonScope();
    }
};
