import path from "path";
import { Container } from "@webiny/di";
import {
    beforeBuild,
    afterBuild,
    beforeWatch,
    beforeDeploy,
    afterDeploy,
    adminAfterBuild,
    adminAfterDeploy,
    adminBeforeBuild,
    adminBeforeDeploy,
    adminBeforeWatch,
    adminPulumi,
    apiAfterBuild,
    apiAfterDeploy,
    apiBeforeBuild,
    apiBeforeDeploy,
    apiBeforeWatch,
    apiPulumi,
    buildApp,
    coreAfterBuild,
    coreAfterDeploy,
    coreBeforeBuild,
    coreBeforeDeploy,
    coreBeforeWatch,
    corePulumi,
    deployApp,
    destroyApp,
    getApp,
    getAppOutput,
    getAppStackExport,
    getAppStackOutput,
    getLogger,
    getProductionEnvironments,
    getProject,
    getProjectConfig,
    getProjectInfo,
    getPulumiResourceNamePrefix,
    isCi,
    isTelemetryEnabled,
    refreshApp,
    runPulumiCommand,
    validateProjectConfig,
    watch
} from "./features/index.js";

import {
    getAppService,
    buildAppWorkspaceService,
    buildProjectWorkspaceService,
    getAppPackagesService,
    getCwdService,
    getIsCiService,
    getNpmVersionService,
    getNpxVersionService,
    getProjectConfigService,
    getProjectIdService,
    getProjectService,
    getProjectVersionService,
    getPulumiService,
    getPulumiVersionService,
    getYarnVersionService,
    listAppLambdaFunctionsService,
    listDeployedEnvironmentsService,
    listPackagesInAppWorkspaceService,
    listPackagesService,
    loadEnvVarsService,
    localStorageService,
    loggerService,
    projectInfoService,
    projectSdkParamsService,
    pulumiGetConfigPassphraseService,
    pulumiGetSecretsProviderService,
    pulumiGetStackExportService,
    pulumiGetStackOutputService,
    pulumiLoginService,
    pulumiSelectStackService,
    setProjectIdService,
    stdioService,
    uiService,
    validateProjectConfigService,
    wcpService
} from "./services/index.js";

import { buildAppWithHooks, deployAppWithHooks, watchWithHooks } from "./decorators/index.js";

import {
    GetProject,
    GetProjectConfig,
    BuildProjectWorkspaceService,
    ProjectSdkParamsService,
    LoadEnvVarsService,
    ValidateProjectConfig,
    LoggerService
} from "~/abstractions/index.js";

import {
    adminAfterBuild as adminAfterBuildExt,
    adminAfterDeploy as adminAfterDeployExt,
    adminBeforeBuild as adminBeforeBuildExt,
    adminBeforeDeploy as adminBeforeDeployExt,
    adminBeforeWatch as adminBeforeWatchExt,
    afterBuild as afterBuildExt,
    beforeWatch as beforeWatchExt,
    apiAfterBuild as apiAfterBuildExt,
    apiAfterDeploy as apiAfterDeployExt,
    apiBeforeBuild as apiBeforeBuildExt,
    apiBeforeDeploy as apiBeforeDeployExt,
    apiBeforeWatch as apiBeforeWatchExt,
    beforeBuild as beforeBuildExt,
    beforeDeploy as beforeDeployExt,
    afterDeploy as afterDeployExt,
    coreAfterBuild as coreAfterBuildExt,
    coreAfterDeploy as coreAfterDeployExt,
    coreBeforeBuild as coreBeforeBuildExt,
    coreBeforeDeploy as coreBeforeDeployExt,
    coreBeforeWatch as coreBeforeWatchExt
} from "./extensions/hooks/index.js";

import {
    corePulumi as corePulumiExt,
    apiPulumi as apiPulumiExt,
    adminPulumi as adminPulumiExt
} from "./extensions/pulumi/index.js";

import { projectDecorator as projectDecoratorExt } from "./extensions/projectDecorator.js";
import { projectImplementation as projectImplementationExt } from "./extensions/projectImplementation.js";
import { envVar as envVarExt } from "./extensions/envVar.js";

export const createProjectSdkContainer = async (
    params: Partial<ProjectSdkParamsService.Params>
) => {
    const container = new Container();

    // Services.
    container.register(getAppService).inSingletonScope();
    container.register(buildAppWorkspaceService).inSingletonScope();
    container.register(buildProjectWorkspaceService).inSingletonScope();
    container.register(getAppPackagesService).inSingletonScope();
    container.register(getCwdService).inSingletonScope();
    container.register(getIsCiService).inSingletonScope();
    container.register(getNpmVersionService).inSingletonScope();
    container.register(getNpxVersionService).inSingletonScope();
    container.register(getProjectConfigService).inSingletonScope();
    container.register(getProjectIdService).inSingletonScope();
    container.register(getProjectService).inSingletonScope();
    container.register(getProjectVersionService).inSingletonScope();
    container.register(getPulumiService).inSingletonScope();
    container.register(getPulumiVersionService).inSingletonScope();
    container.register(getYarnVersionService).inSingletonScope();
    container.register(listAppLambdaFunctionsService).inSingletonScope();
    container.register(listDeployedEnvironmentsService).inSingletonScope();
    container.register(listPackagesInAppWorkspaceService).inSingletonScope();
    container.register(listPackagesService).inSingletonScope();
    container.register(loadEnvVarsService).inSingletonScope();
    container.register(localStorageService).inSingletonScope();
    container.register(loggerService).inSingletonScope();
    container.register(projectInfoService).inSingletonScope();
    container.register(projectSdkParamsService).inSingletonScope();
    container.register(pulumiGetConfigPassphraseService).inSingletonScope();
    container.register(pulumiGetSecretsProviderService).inSingletonScope();
    container.register(pulumiGetStackExportService).inSingletonScope();
    container.register(pulumiGetStackOutputService).inSingletonScope();
    container.register(pulumiLoginService).inSingletonScope();
    container.register(pulumiSelectStackService).inSingletonScope();
    container.register(setProjectIdService).inSingletonScope();
    container.register(stdioService).inSingletonScope();
    container.register(uiService).inSingletonScope();
    container.register(validateProjectConfigService).inSingletonScope();
    container.register(wcpService).inSingletonScope();

    // Features.
    container.register(buildApp).inSingletonScope();
    container.register(deployApp).inSingletonScope();
    container.register(destroyApp).inSingletonScope();
    container.register(getApp).inSingletonScope();
    container.register(getAppOutput).inSingletonScope();
    container.register(getAppStackExport).inSingletonScope();
    container.register(getAppStackOutput).inSingletonScope();
    container.register(getLogger).inSingletonScope();
    container.register(getProductionEnvironments).inSingletonScope();
    container.register(getProject).inSingletonScope();
    container.register(getProjectConfig).inSingletonScope();
    container.register(getProjectInfo).inSingletonScope();
    container.register(getPulumiResourceNamePrefix).inSingletonScope();
    container.register(isCi).inSingletonScope();
    container.register(isTelemetryEnabled).inSingletonScope();
    container.register(refreshApp).inSingletonScope();
    container.register(runPulumiCommand).inSingletonScope();
    container.register(validateProjectConfig).inSingletonScope();
    container.register(watch).inSingletonScope();

    // Hooks.
    container.registerComposite(beforeBuild);
    container.registerComposite(afterBuild);
    container.registerComposite(beforeWatch);
    container.registerComposite(beforeDeploy);
    container.registerComposite(afterDeploy);
    container.registerComposite(apiBeforeBuild);
    container.registerComposite(apiBeforeDeploy);
    container.registerComposite(apiBeforeWatch);
    container.registerComposite(apiAfterBuild);
    container.registerComposite(apiAfterDeploy);
    container.registerComposite(adminBeforeBuild);
    container.registerComposite(adminBeforeDeploy);
    container.registerComposite(adminBeforeWatch);
    container.registerComposite(adminAfterBuild);
    container.registerComposite(adminAfterDeploy);
    container.registerComposite(coreBeforeBuild);
    container.registerComposite(coreBeforeDeploy);
    container.registerComposite(coreBeforeWatch);
    container.registerComposite(coreAfterBuild);
    container.registerComposite(coreAfterDeploy);

    // Initialize project SDK.
    container.resolve(ProjectSdkParamsService).set(params);
    await container.resolve(LoadEnvVarsService).execute();
    await container.resolve(BuildProjectWorkspaceService).execute();

    const logger = container.resolve(LoggerService);
    logger.log("Initializing Project SDK container...");

    const projectExtensions = await container.resolve(GetProjectConfig).execute({
        tags: { runtimeContext: "project" }
    });

    await container.resolve(ValidateProjectConfig).execute(projectExtensions);

    // Apply environment variables from extensions.
    const envVarExtensions = projectExtensions.extensionsByType(envVarExt);
    for (const envVarExtension of envVarExtensions) {
        if (!process.env[envVarExtension.params.varName]) {
            process.env[envVarExtension.params.varName] = envVarExtension.params.value;
        }
    }

    const project = container.resolve(GetProject).execute();

    const importFromPath = async (filePath: string) => {
        let importPath = filePath;
        if (!path.isAbsolute(filePath)) {
            // If the path is not absolute, we assume it's relative to the current working directory.
            importPath = project.paths.rootFolder.join(filePath).toString();
        }

        const exportName = path.basename(filePath).replace(path.extname(filePath), "");

        const importedModule = await import(importPath);
        return importedModule[exportName];
    };

    // Hooks.
    const hooksExtensions = [
        ...projectExtensions.extensionsByType(adminAfterBuildExt),
        ...projectExtensions.extensionsByType(beforeBuildExt),
        ...projectExtensions.extensionsByType(beforeWatchExt),
        ...projectExtensions.extensionsByType(afterBuildExt),
        ...projectExtensions.extensionsByType(beforeDeployExt),
        ...projectExtensions.extensionsByType(afterDeployExt),
        ...projectExtensions.extensionsByType(adminBeforeBuildExt),
        ...projectExtensions.extensionsByType(adminBeforeDeployExt),
        ...projectExtensions.extensionsByType(adminBeforeWatchExt),
        ...projectExtensions.extensionsByType(adminAfterBuildExt),
        ...projectExtensions.extensionsByType(adminAfterDeployExt),
        ...projectExtensions.extensionsByType(apiBeforeBuildExt),
        ...projectExtensions.extensionsByType(apiBeforeDeployExt),
        ...projectExtensions.extensionsByType(apiBeforeWatchExt),
        ...projectExtensions.extensionsByType(apiAfterBuildExt),
        ...projectExtensions.extensionsByType(apiAfterDeployExt),
        ...projectExtensions.extensionsByType(coreBeforeBuildExt),
        ...projectExtensions.extensionsByType(coreBeforeDeployExt),
        ...projectExtensions.extensionsByType(coreBeforeWatchExt),
        ...projectExtensions.extensionsByType(coreAfterBuildExt),
        ...projectExtensions.extensionsByType(coreAfterDeployExt)
    ];

    for (const hookExtension of hooksExtensions) {
        const hookImpl = await importFromPath(hookExtension.params.src);
        container.register(hookImpl).inSingletonScope();
    }

    const pulumiExtensions = [
        ...projectExtensions.extensionsByType(corePulumiExt),
        ...projectExtensions.extensionsByType(apiPulumiExt),
        ...projectExtensions.extensionsByType(adminPulumiExt)
    ];

    for (const pulumiExtension of pulumiExtensions) {
        const pulumiImpl = await importFromPath(pulumiExtension.params.src);
        container.register(pulumiImpl).inSingletonScope();
    }

    // Pulumi.
    container.registerComposite(corePulumi);
    container.registerComposite(apiPulumi);
    container.registerComposite(adminPulumi);

    // Decorators that must be applied last on top of potentially custom ones.
    container.registerDecorator(buildAppWithHooks);
    container.registerDecorator(deployAppWithHooks);
    container.registerDecorator(watchWithHooks);

    // Register custom implementations first (they replace existing implementations)
    const projectImplementations = [
        ...projectExtensions.extensionsByType(projectImplementationExt)
    ];

    for (const projectImplementation of projectImplementations) {
        const projectImplementationImpl = await importFromPath(projectImplementation.params.src);
        const binding = container.register(projectImplementationImpl);

        // Apply singleton scope if specified (defaults to true)
        if (projectImplementation.params.singleton) {
            binding.inSingletonScope();
        }
    }

    // Register decorators after implementations (they enhance existing implementations)
    const projectDecorators = [...projectExtensions.extensionsByType(projectDecoratorExt)];

    for (const projectDecorator of projectDecorators) {
        const projectDecoratorImpl = await importFromPath(projectDecorator.params.src);
        container.registerDecorator(projectDecoratorImpl);
    }
    return container;
};
