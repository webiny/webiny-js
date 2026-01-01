import { createImplementation } from "@webiny/di";
import path from "path";
import {
    GetProjectConfigService,
    GetProjectService,
    LoggerService,
    ProjectSdkParamsService
} from "~/abstractions/index.js";
import {
    type ExtensionDto,
    type ExtensionType,
    type IHydratedProjectConfig,
    type IProjectConfigDto
} from "~/abstractions/models/index.js";
import { ExtensionDefinitions as ExtensionDefinitionsExtension } from "~/extensions/ExtensionDefinitions.js";
import { ExtensionInstanceModel } from "~/defineExtension/index.js";
import { ProjectConfigModel } from "~/models/ProjectConfigModel.js";
import { renderConfig } from "./renderConfig.js";
import { extractProductionEnvironmentsFromConfig } from "~/utils/index.js";

export class DefaultGetProjectConfigService implements GetProjectConfigService.Interface {
    cachedRenderedConfigs: Record<string, IProjectConfigDto> = {};
    cachedProductionEnvironments: string[] | null = null;

    constructor(
        private readonly getProjectService: GetProjectService.Interface,
        private readonly projectSdkParamsService: ProjectSdkParamsService.Interface,
        private readonly loggerService: LoggerService.Interface
    ) {}

    async execute(
        params: GetProjectConfigService.Params = {}
    ): Promise<GetProjectConfigService.Result> {
        const project = this.getProjectService.execute();

        const currentTime = Date.now();
        const cacheKey = JSON.stringify(params.renderArgs);
        if (!this.cachedRenderedConfigs[cacheKey]) {
            this.loggerService.info(
                { renderArgs: params.renderArgs },
                `Rendering project config...`
            );

            try {
                const projectSdkParams = this.projectSdkParamsService.get();
                this.cachedRenderedConfigs[cacheKey] = await renderConfig({
                    project,
                    args: params.renderArgs,
                    sdkParams: projectSdkParams,
                    productionEnvironments: this.cachedProductionEnvironments || undefined
                });
            } catch (err) {
                this.loggerService.error(
                    { err },
                    `There was an error while rendering the project config. `
                );

                throw new Error(
                    `An error occurred while rendering "webiny.config.tsx" config file:\n${err.message}`
                );
            }
        } else {
            this.loggerService.info(
                { renderArgs: params.renderArgs },
                `Skipping rendering project config (cache hit)...`
            );
        }

        const renderedConfig = this.cachedRenderedConfigs[cacheKey];
        this.loggerService.debug({ config: renderedConfig }, `Project config rendering complete.`);

        // Extract and cache production environments from the rendered config
        // This will be used in subsequent renders
        if (!this.cachedProductionEnvironments) {
            this.cachedProductionEnvironments = extractProductionEnvironmentsFromConfig(renderedConfig);
            this.loggerService.debug(
                { productionEnvironments: this.cachedProductionEnvironments },
                `Extracted production environments from config.`
            );
        }

        const hydratedConfig = await this.hydrateConfig(renderedConfig, params);
        this.loggerService.debug({ config: hydratedConfig }, `Project config hydration complete.`);

        const model = ProjectConfigModel.create(hydratedConfig);

        const duration = Date.now() - currentTime;
        this.loggerService.info(`Project config rendered and hydrated in ${duration}ms.`);

        return model;
    }

    private async hydrateConfig(
        configDto: IProjectConfigDto,
        params: GetProjectConfigService.Params
    ): Promise<IHydratedProjectConfig> {
        const projectSdkParams = this.projectSdkParamsService.get();
        const project = this.getProjectService.execute();

        const importFromPath = (filePath: string) => {
            let importPath = filePath;
            if (!path.isAbsolute(filePath)) {
                // If the path is not absolute, we assume it's relative to the current working directory.
                importPath = project.paths.rootFolder.join(filePath).toString();
            }

            return import(importPath);
        };

        const tagsFilters = params?.tags || {};

        // Exclude extra extension definitions because we are handling these separately.
        const extensionDefinitionsType = ExtensionDefinitionsExtension.definition.type;

        const extensionsTypes = Object.keys(configDto).filter(
            key => key !== extensionDefinitionsType
        ) as ExtensionType[];

        const allExtensionDefinitions = projectSdkParams.extensions;

        // Extra definitions registered via config (e.g. `packages/project-aws/src/Webiny.tsx`).
        const extensionDefinitionsExtensions = (configDto[extensionDefinitionsType] ||
            []) as ExtensionDto[];

        for (const ext of extensionDefinitionsExtensions) {
            // Load the extension from give `src`.
            const { default: importedExtensionDefinitions } = await importFromPath(ext.src);

            allExtensionDefinitions?.push(...importedExtensionDefinitions);
        }

        this.loggerService.info({ scopesFilter: tagsFilters }, `Hydrating project config...`);

        return extensionsTypes.reduce<IHydratedProjectConfig>(
            (acc, extensionType: ExtensionType) => {
                const oneOrMoreExtensions = configDto[extensionType];
                const extensionsArray = Array.isArray(oneOrMoreExtensions)
                    ? [...oneOrMoreExtensions]
                    : [oneOrMoreExtensions];

                const matchedExtensions = extensionsArray
                    .map(extensionParams => {
                        const extDef = projectSdkParams.extensions?.find(e => {
                            return e.type === extensionType;
                        });

                        if (!extDef) {
                            this.loggerService.warn(
                                `Could not find extension definition for type: ${extensionType}. Skipping...`
                            );
                            return null;
                        }

                        if (Object.keys(tagsFilters).length > 0) {
                            const extDefTags = extDef.tags;

                            const hasMatchingTags = Object.keys(tagsFilters).every(tag => {
                                const filterValue = tagsFilters[tag];
                                const extDefValue = extDefTags[tag];

                                // Otherwise, check for strict equality.
                                return extDefValue === filterValue;
                            });

                            if (!hasMatchingTags) {
                                return null;
                            }
                        }

                        return new ExtensionInstanceModel(extDef, extensionParams, { project });
                    })
                    .filter(Boolean) as ExtensionInstanceModel<any>[];

                if (matchedExtensions.length > 0) {
                    acc[extensionType] = matchedExtensions;
                }

                return acc;
            },
            {} as IHydratedProjectConfig
        );
    }
}

export const getProjectConfigService = createImplementation({
    abstraction: GetProjectConfigService,
    implementation: DefaultGetProjectConfigService,
    dependencies: [GetProjectService, ProjectSdkParamsService, LoggerService]
});
