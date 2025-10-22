import { createImplementation } from "@webiny/di-container";
import {
    BuildApp,
    BuildAppWorkspaceService,
    GetProjectConfigService,
    ListPackagesInAppWorkspaceService,
    LoggerService,
    ValidateProjectConfigService
} from "~/abstractions/index.js";
import { PackagesBuilder } from "./PackagesBuilder/PackagesBuilder.js";

export class DefaultBuildApp implements BuildApp.Interface {
    constructor(
        private buildAppWorkspaceService: BuildAppWorkspaceService.Interface,
        private logger: LoggerService.Interface,
        private listPackagesService: ListPackagesInAppWorkspaceService.Interface,
        private getProjectConfigService: GetProjectConfigService.Interface,
        private validateProjectConfigService: ValidateProjectConfigService.Interface
    ) {}

    async execute(params: BuildApp.Params) {
        await this.buildAppWorkspaceService.execute(params);

        const projectConfig = await this.getProjectConfigService.execute({
            tags: { appName: params.app, runtimeContext: "app-build" },
            renderArgs: params
        });

        await this.validateProjectConfigService.execute(projectConfig);

        for (const extensionType in projectConfig.config) {
            const oneOrMoreExtensions = projectConfig.config[extensionType];
            const extensionsArray = Array.isArray(oneOrMoreExtensions)
                ? [...oneOrMoreExtensions]
                : [oneOrMoreExtensions];

            for (const extensionInstance of extensionsArray) {
                await extensionInstance.build();
            }
        }

        const packages = await this.listPackagesService.execute(params.app);

        return new PackagesBuilder({
            packages,
            params,
            logger: this.logger
        });
    }
}

export const buildApp = createImplementation({
    abstraction: BuildApp,
    implementation: DefaultBuildApp,
    dependencies: [
        BuildAppWorkspaceService,
        LoggerService,
        ListPackagesInAppWorkspaceService,
        GetProjectConfigService,
        ValidateProjectConfigService
    ]
});
