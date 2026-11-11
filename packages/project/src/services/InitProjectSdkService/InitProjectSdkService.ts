import { createImplementation, Container } from "@webiny/di";
import { GetProjectService } from "~/abstractions/index.js";
import { GetProjectConfig } from "~/abstractions/index.js";
import { InitHostingSdkService } from "~/abstractions/index.js";
import { InitProjectSdkService } from "~/abstractions/index.js";
import { buildAppWithHooks } from "~/decorators/index.js";
import { watchWithHooks } from "~/decorators/index.js";
import { registerHooks } from "./registerHooks.js";
import { registerImplementations } from "./registerImplementations.js";
import { registerDecorators } from "./registerDecorators.js";
import { traceAsync } from "~/utils/trace/index.js";

export class DefaultInitProjectSdkService implements InitProjectSdkService.Interface {
    constructor(
        private getProjectService: GetProjectService.Interface,
        private getProjectConfig: GetProjectConfig.Interface,
        private initHostingSdkServices: InitHostingSdkService.Interface[]
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

        // Let the hosting package register what it needs from the config.
        await traceAsync("init hosting SDK", async () => {
            for (const initHostingSdkService of this.initHostingSdkServices) {
                await initHostingSdkService.execute({ container, projectExtensions, project });
            }
        });

        // Decorators that must be applied last on top of potentially custom ones.
        container.registerDecorator(buildAppWithHooks);
        container.registerDecorator(watchWithHooks);

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
    dependencies: [GetProjectService, GetProjectConfig, [InitHostingSdkService, { multiple: true }]]
});
