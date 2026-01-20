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
    exportStack,
    getApp,
    getAppOutput,
    getAppStackOutput,
    getLogger,
    getProductionEnvironments,
    getProject,
    getProjectConfig,
    getProjectInfo,
    getPulumiResourceNamePrefix,
    installExtension,
    isCi,
    isTelemetryEnabled,
    isWcpEnabled,
    isWebinyJsRepo,
    refreshApp,
    runPulumiCommand,
    validateProjectConfig,
    watch
} from "./features/index.js";

import {
    getAppService,
    buildAppWorkspaceService,
    buildProjectWorkspaceService,
    watchedLambdaFunctionsService,
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
    installExtensionService,
    isRemotePulumiBackendService,
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
    pulumiExportService,
    pulumiImportService,
    pulumiGetStackOutputService,
    pulumiLoginService,
    pulumiSelectStackService,
    setProjectIdService,
    stdioService,
    uiService,
    validateProjectConfigService,
    wcpService
} from "./services/index.js";

import {
    buildAppWithHooks,
    deployAppClearWatchedLambdaFunctions,
    deployAppRefreshStackOutputCache,
    deployAppWithHooks,
    deployAppWithWatchedLambdaReplacement,
    watchWithHooks,
    getPulumiServiceWithDownloadInfo
} from "./decorators/index.js";

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
} from "./extensions/hooks/index.js";

import {
    CorePulumi as CorePulumiExt,
    ApiPulumi as ApiPulumiExt,
    AdminPulumi as AdminPulumiExt
} from "./extensions/pulumi/index.js";

import { ProjectDecorator as ProjectDecoratorExt } from "./extensions/ProjectDecorator.js";
import { ProjectImplementation as ProjectImplementationExt } from "./extensions/ProjectImplementation.js";
import { EnvVar as EnvVarExt } from "./extensions/EnvVar.js";

export const createProjectSdkContainer = async (
    params: Partial<ProjectSdkParamsService.Params>
) => {
    const container = new Container();

    // Services.
    container.register(getAppService).inSingletonScope();
    container.register(buildAppWorkspaceService).inSingletonScope();
    container.register(buildProjectWorkspaceService).inSingletonScope();
    container.register(watchedLambdaFunctionsService).inSingletonScope();
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
    container.register(installExtensionService).inSingletonScope();
    container.register(isRemotePulumiBackendService).inSingletonScope();
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
    container.register(pulumiExportService).inSingletonScope();
    container.register(pulumiImportService).inSingletonScope();
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
    container.register(exportStack).inSingletonScope();
    container.register(getApp).inSingletonScope();
    container.register(getAppOutput).inSingletonScope();
    container.register(getAppStackOutput).inSingletonScope();
    container.register(getLogger).inSingletonScope();
    container.register(getProductionEnvironments).inSingletonScope();
    container.register(getProject).inSingletonScope();
    container.register(getProjectConfig).inSingletonScope();
    container.register(getProjectInfo).inSingletonScope();
    container.register(getPulumiResourceNamePrefix).inSingletonScope();
    container.register(installExtension).inSingletonScope();
    container.register(isCi).inSingletonScope();
    container.register(isTelemetryEnabled).inSingletonScope();
    container.register(isWcpEnabled).inSingletonScope();
    container.register(isWebinyJsRepo).inSingletonScope();
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
    const envVarExtensions = projectExtensions.extensionsByType(EnvVarExt);
    for (const envVarExtension of envVarExtensions) {
        if (!process.env[envVarExtension.params.varName]) {
            process.env[envVarExtension.params.varName] = envVarExtension.params.value;
        }
    }

    const project = container.resolve(GetProject).execute();

    const importFromPath = async (filePath: string) => {
        let importPath: string;
        if (filePath.startsWith("/extensions/")) {
            // Resolve from project root.
            importPath = project.paths.rootFolder.join(filePath).toString();
        } else {
            // Treat as absolute path.
            importPath = filePath;
        }

        const importedModule = await import(importPath);
        return importedModule.default;
    };

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
        const hookImpl = await importFromPath(hookExtension.params.src);
        container.register(hookImpl).inSingletonScope();
    }

    const pulumiExtensions = [
        ...projectExtensions.extensionsByType(CorePulumiExt),
        ...projectExtensions.extensionsByType(ApiPulumiExt),
        ...projectExtensions.extensionsByType(AdminPulumiExt)
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
    container.registerDecorator(deployAppWithWatchedLambdaReplacement);
    container.registerDecorator(deployAppClearWatchedLambdaFunctions);
    container.registerDecorator(deployAppRefreshStackOutputCache);
    container.registerDecorator(deployAppWithHooks);
    container.registerDecorator(watchWithHooks);
    container.registerDecorator(getPulumiServiceWithDownloadInfo);

    // Register custom implementations first (they replace existing implementations)
    const projectImplementations = [
        ...projectExtensions.extensionsByType(ProjectImplementationExt)
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
    const projectDecorators = [...projectExtensions.extensionsByType(ProjectDecoratorExt)];

    for (const projectDecorator of projectDecorators) {
        const projectDecoratorImpl = await importFromPath(projectDecorator.params.src);
        container.registerDecorator(projectDecoratorImpl);
    }

    return container;
};
