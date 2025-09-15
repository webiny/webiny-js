import { createImplementation } from "@webiny/di-container";
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
import { extensionDefinitions as extensionDefinitionsExtension } from "~/extensions/builtInExtensions/extensionDefinitions.js";
import { ExtensionInstanceModel } from "~/extensions/index.js";
import { ProjectConfigModel } from "~/models/ProjectConfigModel.js";
import { renderConfig } from "./renderConfig.js";

export class DefaultGetProjectConfigService implements GetProjectConfigService.Interface {
    cachedRenderedConfigs: Record<string, IProjectConfigDto> = {};

    constructor(
        private readonly getProjectService: GetProjectService.Interface,
        private readonly projectSdkParamsService: ProjectSdkParamsService.Interface,
        private readonly loggerService: LoggerService.Interface
    ) {}

    async execute(
        params: GetProjectConfigService.Params = {}
    ): Promise<GetProjectConfigService.Result> {
        const project = this.getProjectService.execute();

        const cacheKey = JSON.stringify(params.renderArgs);
        if (!this.cachedRenderedConfigs[cacheKey]) {
            this.cachedRenderedConfigs[cacheKey] = await renderConfig({
                project,
                args: params.renderArgs
            });
        }

        const renderedConfig = this.cachedRenderedConfigs[cacheKey];
        const hydratedConfig = await this.hydrateConfig(renderedConfig, params);

        return ProjectConfigModel.create(hydratedConfig);
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

            // eslint-disable-next-line import/dynamic-import-chunkname
            return import(importPath);
        };

        const tagsFilters = params?.tags || {};

        // Exclude extra extension definitions because we are handling these separately.
        const extensionDefinitionsType = extensionDefinitionsExtension.definition.type;

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

        this.loggerService.debug(`Hydrating project config with the following parameters:`, {
            scopesFilter: tagsFilters,
            extensionsTypes,
            allExtensionDefinitions,
            configDto
        });

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
                            this.loggerService.debug(
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
