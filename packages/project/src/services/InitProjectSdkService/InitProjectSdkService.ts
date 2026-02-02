import { createImplementation } from "@webiny/di";
import {
    GetProjectService,
    InitProjectSdkService
} from "~/abstractions/index.js";
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

import {
    CorePulumi as CorePulumiExt,
    ApiPulumi as ApiPulumiExt,
    AdminPulumi as AdminPulumiExt
} from "~/extensions/pulumi/index.js";

import { ProjectDecorator as ProjectDecoratorExt } from "~/extensions/ProjectDecorator.js";
import { ProjectImplementation as ProjectImplementationExt } from "~/extensions/ProjectImplementation.js";
import { EnvVar as EnvVarExt } from "~/extensions/EnvVar.js";

export class DefaultInitProjectSdkService implements InitProjectSdkService.Interface {
    constructor(private getProjectService: GetProjectService.Interface) {}

    async execute(params: InitProjectSdkService.Params) {
        const { container, projectExtensions } = params;
        const project = this.getProjectService.execute();

        // Apply environment variables from extensions.
        const envVarExtensions = projectExtensions.extensionsByType(EnvVarExt);
        for (const envVarExtension of envVarExtensions) {
            if (!process.env[envVarExtension.params.varName]) {
                process.env[envVarExtension.params.varName] = envVarExtension.params.value;
            }
        }

        // Hooks.
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
            const hookImpl = await ImplPathResolver.importFromPath(
                hookExtension.params.src,
                project
            );
            container.register(hookImpl).inSingletonScope();
        }

        const pulumiExtensions = [
            ...projectExtensions.extensionsByType(CorePulumiExt),
            ...projectExtensions.extensionsByType(ApiPulumiExt),
            ...projectExtensions.extensionsByType(AdminPulumiExt)
        ];

        for (const pulumiExtension of pulumiExtensions) {
            const pulumiImpl = await ImplPathResolver.importFromPath(
                pulumiExtension.params.src,
                project
            );
            container.register(pulumiImpl).inSingletonScope();
        }

        // Register custom implementations first (they replace existing implementations)
        const projectImplementations = [
            ...projectExtensions.extensionsByType(ProjectImplementationExt)
        ];

        for (const projectImplementation of projectImplementations) {
            const projectImplementationImpl = await ImplPathResolver.importFromPath(
                projectImplementation.params.src,
                project
            );
            const binding = container.register(projectImplementationImpl);

            // Apply singleton scope if specified (defaults to true)
            if (projectImplementation.params.singleton) {
                binding.inSingletonScope();
            }
        }

        // Register decorators after implementations (they enhance existing implementations)
        const projectDecorators = [...projectExtensions.extensionsByType(ProjectDecoratorExt)];

        for (const projectDecorator of projectDecorators) {
            const projectDecoratorImpl = await ImplPathResolver.importFromPath(
                projectDecorator.params.src,
                project
            );
            container.registerDecorator(projectDecoratorImpl);
        }
    }
}

export const initProjectSdkService = createImplementation({
    abstraction: InitProjectSdkService,
    implementation: DefaultInitProjectSdkService,
    dependencies: [GetProjectService]
});
