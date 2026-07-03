import { Container } from "@webiny/di";
import {
    beforeBuild,
    afterBuild,
    beforeWatch,
    adminAfterBuild,
    adminBeforeBuild,
    adminBeforeWatch,
    apiAfterBuild,
    apiBeforeBuild,
    apiBeforeWatch,
    coreAfterBuild,
    coreBeforeBuild,
    coreBeforeWatch,
    buildApp,
    getApp,
    getLogger,
    getProductionEnvironments,
    getProject,
    getProjectConfig,
    getProjectInfo,
    getFeatureFlags,
    installExtension,
    isCi,
    isTelemetryEnabled,
    isWcpEnabled,
    isWebinyJsRepo,
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
    getProjectInstallationIdService,
    getProjectService,
    getProjectVersionService,
    getPulumiVersionService,
    getYarnVersionService,
    initProjectSdkService,
    installExtensionService,
    listPackagesInAppWorkspaceService,
    listPackagesService,
    loadEnvVarsService,
    localStorageService,
    loggerService,
    projectInfoService,
    projectSdkParamsService,
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
    params: Partial<ProjectSdkParamsService.Params>,
    register?: (container: Container) => void
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
    container.register(getProjectInstallationIdService).inSingletonScope();
    container.register(getProjectService).inSingletonScope();
    container.register(getProjectVersionService).inSingletonScope();
    container.register(getPulumiVersionService).inSingletonScope();
    container.register(getYarnVersionService).inSingletonScope();
    container.register(initProjectSdkService).inSingletonScope();
    container.register(installExtensionService).inSingletonScope();
    container.register(listPackagesInAppWorkspaceService).inSingletonScope();
    container.register(listPackagesService).inSingletonScope();
    container.register(loadEnvVarsService).inSingletonScope();
    container.register(localStorageService).inSingletonScope();
    container.register(loggerService).inSingletonScope();
    container.register(projectInfoService).inSingletonScope();
    container.register(projectSdkParamsService).inSingletonScope();
    container.register(setProjectIdService).inSingletonScope();
    container.register(stdioService).inSingletonScope();
    container.register(uiService).inSingletonScope();
    container.register(validateProjectConfigService).inSingletonScope();
    container.register(wcpService).inSingletonScope();

    // Features.
    container.register(buildApp).inSingletonScope();
    container.register(getApp).inSingletonScope();
    container.register(getLogger).inSingletonScope();
    container.register(getProductionEnvironments).inSingletonScope();
    container.register(getProject).inSingletonScope();
    container.register(getProjectConfig).inSingletonScope();
    container.register(getProjectInfo).inSingletonScope();
    container.register(installExtension).inSingletonScope();
    container.register(isCi).inSingletonScope();
    container.register(isTelemetryEnabled).inSingletonScope();
    container.register(isWcpEnabled).inSingletonScope();
    container.register(isWebinyJsRepo).inSingletonScope();
    container.register(getFeatureFlags).inSingletonScope();
    container.register(validateProjectConfig).inSingletonScope();
    container.register(watch).inSingletonScope();
    container.registerDecorator(getFeatureFlagsWithLicense);

    // Hooks (cloud-agnostic: build + watch).
    container.registerComposite(beforeBuild);
    container.registerComposite(afterBuild);
    container.registerComposite(beforeWatch);
    container.registerComposite(apiBeforeBuild);
    container.registerComposite(apiBeforeWatch);
    container.registerComposite(apiAfterBuild);
    container.registerComposite(adminBeforeBuild);
    container.registerComposite(adminBeforeWatch);
    container.registerComposite(adminAfterBuild);
    container.registerComposite(coreBeforeBuild);
    container.registerComposite(coreAfterBuild);
    container.registerComposite(coreBeforeWatch);

    // Initialize project SDK.
    container.resolve(ProjectSdkParamsService).set(params);

    // Allow flavour-specific registrations (e.g. project-aws, project-server).
    // Must run before workspace services execute so decorators are in place.
    register?.(container);

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
