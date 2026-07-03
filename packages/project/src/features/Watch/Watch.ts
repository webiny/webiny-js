import { createImplementation } from "@webiny/di";
import {
    BuildAppWorkspaceService,
    GetApp,
    GetProductionEnvironments,
    GetProject,
    GetProjectConfigService,
    ListPackagesService,
    LoggerService,
    ProjectSdkParamsService,
    ValidateProjectConfigService,
    Watch
} from "~/abstractions/index.js";
import chalk from "chalk";
import { PackagesWatcher } from "./watchers/PackagesWatcher.js";
import { WebinyConfigWatcher } from "~/features/Watch/watchers/WebinyConfigWatcher.js";

export class DefaultWatch implements Watch.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private logger: LoggerService.Interface,
        private listPackagesService: ListPackagesService.Interface,
        private getProject: GetProject.Interface,
        private getProjectConfigService: GetProjectConfigService.Interface,
        private validateProjectConfigService: ValidateProjectConfigService.Interface,
        private getProductionEnvironments: GetProductionEnvironments.Interface,
        private buildAppWorkspaceService: BuildAppWorkspaceService.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface
    ) {}

    async execute(params: Watch.Params): Promise<Watch.Result> {
        const hasAppOrPackage = "app" in params || "package" in params;
        if (!hasAppOrPackage) {
            throw new Error(
                `Either "app" or "package" arguments must be passed. Cannot have both undefined.`
            );
        }

        // If we're not watching a specific app, we can only watch packages.
        if (!("app" in params)) {
            const whitelistArray = Array.isArray(params.package)
                ? params.package
                : ([params.package].filter(Boolean) as string[]);

            const packages = await this.listPackagesService.execute({
                packageWhitelist: whitelistArray
            });

            const packagesWatcher = new PackagesWatcher({ packages, params, logger: this.logger });

            return { packagesWatcher };
        }

        // Get project application metadata.
        const app = this.getApp.execute(params.app);

        if (!app) {
            throw new Error(
                `Invalid app name "${params.app}". Please specify a valid app name (core, api, or admin).`
            );
        }

        const sdkParams = this.projectSdkParamsService.get();

        const productionEnvironments = await this.getProductionEnvironments.execute();

        if (productionEnvironments.includes(sdkParams.env)) {
            if (!params.allowProduction) {
                throw new Error(
                    `${chalk.red(
                        "webiny watch"
                    )} command cannot be used with production environments.`
                );
            }
        }

        await this.buildAppWorkspaceService.execute(params.app, { forceRebuild: true });

        const logger = this.logger;
        const project = this.getProject.execute();
        const getProjectConfigService = this.getProjectConfigService;
        const validateProjectConfigService = this.validateProjectConfigService;

        const projectConfig = await getProjectConfigService.execute({
            tags: { appName: params.app, runtimeContext: "app-build" },
            renderArgs: params
        });

        await validateProjectConfigService.execute(projectConfig);

        for (const extensionType in projectConfig.config) {
            const oneOrMoreExtensions = projectConfig.config[extensionType];
            const extensionsArray = Array.isArray(oneOrMoreExtensions)
                ? [...oneOrMoreExtensions]
                : [oneOrMoreExtensions];

            for (const extensionInstance of extensionsArray) {
                await extensionInstance.build();
            }
        }

        const webinyConfigWatcher = new WebinyConfigWatcher({
            webinyConfigPath: project.paths.webinyConfigFile.toString(),
            appName: params.app,
            getProjectConfigService,
            validateProjectConfigService
        });

        const packagesWhitelist = Array.isArray(params.package)
            ? params.package
            : ([params.package].filter(Boolean) as string[]);

        const packagesList = await this.listPackagesService.execute({
            appName: app.name,
            packageWhitelist: packagesWhitelist
        });

        const packagesWatcher = new PackagesWatcher({
            packages: packagesList,
            params,
            logger
        });

        return { packagesWatcher, webinyConfigWatcher };
    }
}

export const watch = createImplementation({
    abstraction: Watch,
    implementation: DefaultWatch,
    dependencies: [
        GetApp,
        LoggerService,
        ListPackagesService,
        GetProject,
        GetProjectConfigService,
        ValidateProjectConfigService,
        GetProductionEnvironments,
        BuildAppWorkspaceService,
        ProjectSdkParamsService
    ]
});
