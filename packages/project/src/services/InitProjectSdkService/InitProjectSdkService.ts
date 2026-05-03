import { createImplementation, Container } from "@webiny/di";
import {
    GetProjectService,
    GetProjectConfig,
    InitProjectSdkService
} from "~/abstractions/index.js";
import {
    buildAppWithHooks,
    deployAppClearWatchedLambdaFunctions,
    deployAppRefreshStackOutputCache,
    deployAppWithHooks,
    deployAppWithWatchedLambdaReplacement,
    watchWithHooks,
    getPulumiServiceWithDownloadInfo
} from "~/decorators/index.js";
import { applyEnvVars } from "./applyEnvVars.js";
import { applyWcpEnvVars } from "./applyWcpEnvVars.js";
import { registerHooks } from "./registerHooks.js";
import { registerPulumiExtensions } from "./registerPulumiExtensions.js";
import { registerImplementations } from "./registerImplementations.js";
import { registerDecorators } from "./registerDecorators.js";

export class DefaultInitProjectSdkService implements InitProjectSdkService.Interface {
    constructor(
        private getProjectService: GetProjectService.Interface,
        private getProjectConfig: GetProjectConfig.Interface
    ) {}

    async execute(container: Container) {
        const project = this.getProjectService.execute();
        const projectExtensions = await this.getProjectConfig.execute({
            tags: { runtimeContext: "project" }
        });

        // Apply environment variables from extensions.
        applyEnvVars(projectExtensions);

        // Set WCP environment variables if project ID exists.
        await applyWcpEnvVars(container);

        // Register hooks from extensions.
        await registerHooks(container, projectExtensions, project);

        // Register Pulumi extensions.
        await registerPulumiExtensions(container, projectExtensions, project);

        // Decorators that must be applied last on top of potentially custom ones.
        container.registerDecorator(buildAppWithHooks);
        container.registerDecorator(deployAppWithWatchedLambdaReplacement);
        container.registerDecorator(deployAppClearWatchedLambdaFunctions);
        container.registerDecorator(deployAppRefreshStackOutputCache);
        container.registerDecorator(deployAppWithHooks);
        container.registerDecorator(watchWithHooks);
        container.registerDecorator(getPulumiServiceWithDownloadInfo);

        // Register custom implementations first (they replace existing implementations).
        await registerImplementations(container, projectExtensions, project);

        // Register decorators after implementations (they enhance existing implementations).
        await registerDecorators(container, projectExtensions, project);
    }
}

export const initProjectSdkService = createImplementation({
    abstraction: InitProjectSdkService,
    implementation: DefaultInitProjectSdkService,
    dependencies: [GetProjectService, GetProjectConfig]
});
