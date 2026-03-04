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
    apiAfterBuild,
    apiAfterDeploy,
    apiBeforeBuild,
    apiBeforeDeploy,
    apiBeforeWatch,
    buildApp,
    coreAfterBuild,
    coreAfterDeploy,
    coreBeforeBuild,
    coreBeforeDeploy,
    coreBeforeWatch,
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
    getFeatureFlags,
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
    initProjectSdkService,
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
    GetProjectConfig,
    BuildProjectWorkspaceService,
    ProjectSdkParamsService,
    LoadEnvVarsService,
    ValidateProjectConfig,
    LoggerService,
    InitProjectSdkService
} from "~/abstractions/index.js";
import { getFeatureFlagsWithLicense } from "./decorators/index.js";

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
    container.register(initProjectSdkService).inSingletonScope();
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
    container.register(getFeatureFlags).inSingletonScope();
    container.register(validateProjectConfig).inSingletonScope();
    container.register(watch).inSingletonScope();
    container.registerDecorator(getFeatureFlagsWithLicense);

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

    // Initialize project SDK extensions (env vars, hooks, pulumi, implementations, decorators).
    await container.resolve(InitProjectSdkService).execute(container);

    return container;
};
