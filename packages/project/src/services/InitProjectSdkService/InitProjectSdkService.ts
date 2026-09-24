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
    destroyAppClearStackOutputCache,
    watchWithHooks,
    getPulumiServiceWithDownloadInfo
} from "~/decorators/index.js";
import { registerHooks } from "./registerHooks.js";
import { registerPulumiExtensions } from "./registerPulumiExtensions.js";
import { registerImplementations } from "./registerImplementations.js";
import { registerDecorators } from "./registerDecorators.js";
import { traceAsync } from "~/utils/trace/index.js";

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

        // Environment variables, WCP ones included, are applied by `createProjectSdkContainer` before
        // this runs, because the WCP license has to be known before the config is rendered.

        // Register hooks from extensions.
        await traceAsync("register hooks", () => {
            return registerHooks(container, projectExtensions, project);
        });

        // Register Pulumi extensions.
        await traceAsync("register Pulumi extensions", () => {
            return registerPulumiExtensions(container, projectExtensions, project);
        });

        // Decorators that must be applied last on top of potentially custom ones.
        container.registerDecorator(buildAppWithHooks);
        container.registerDecorator(deployAppWithWatchedLambdaReplacement);
        container.registerDecorator(deployAppClearWatchedLambdaFunctions);
        container.registerDecorator(deployAppRefreshStackOutputCache);
        container.registerDecorator(destroyAppClearStackOutputCache);
        container.registerDecorator(deployAppWithHooks);
        container.registerDecorator(watchWithHooks);
        container.registerDecorator(getPulumiServiceWithDownloadInfo);

        // Register custom implementations first (they replace existing implementations).
        await traceAsync("register implementations", () => {
            return registerImplementations(container, projectExtensions, project);
        });

        // Register decorators after implementations (they enhance existing implementations).
        await traceAsync("register decorators", () => {
            return registerDecorators(container, projectExtensions, project);
        });
    }
}

export const initProjectSdkService = createImplementation({
    abstraction: InitProjectSdkService,
    implementation: DefaultInitProjectSdkService,
    dependencies: [GetProjectService, GetProjectConfig]
});
