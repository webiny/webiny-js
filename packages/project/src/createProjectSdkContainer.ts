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
    watch,
    serve
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
    stackOutputCacheService,
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
import { traceAsync } from "./utils/trace/index.js";
import { applyEnvVars } from "./services/InitProjectSdkService/applyEnvVars.js";
import { applyWcpEnvVars } from "./services/InitProjectSdkService/applyWcpEnvVars.js";

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
    container.register(stackOutputCacheService).inSingletonScope();
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
    container.register(serve).inSingletonScope();
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

    // Allow hosting-specific registrations (e.g. project-aws, project-standalone).
    // Must run before workspace services execute so decorators are in place.
    register?.(container);

    const loadEnvVars = container.resolve(LoadEnvVarsService);
    await traceAsync("load env vars", () => loadEnvVars.execute());

    const buildProjectWorkspace = container.resolve(BuildProjectWorkspaceService);
    await traceAsync("build project workspace", () => buildProjectWorkspace.execute());

    const logger = container.resolve(LoggerService);
    logger.log("Initializing Project SDK container...");

    const projectConfigGetter = container.resolve(GetProjectConfig);
    const getProjectExtensions = () => {
        return projectConfigGetter.execute({
            tags: { runtimeContext: "project" }
        });
    };

    /*
     * The WCP license is an input to the config render: license-gated feature flags decide which
     * extensions the config contains. Fetching the license needs the WCP project ID, though, and
     * unless `WEBINY_PROJECT_ID` is set, the ID comes from the config as well. So the config is read
     * once to learn the project ID and the env vars it sets (a project can supply its WCP API key
     * that way), the WCP env vars and license are fetched, and only then is the config read that
     * every later step uses.
     *
     * The render cache is keyed on the license, so that second read renders again when a license
     * arrived, and is a plain cache hit for a project that isn't linked to WCP.
     */
    const initialProjectExtensions = await traceAsync("read project ID and env vars", () => {
        return getProjectExtensions();
    });
    applyEnvVars(initialProjectExtensions);

    await traceAsync("apply WCP env vars", () => applyWcpEnvVars(container));

    const projectExtensions = await traceAsync("get project extensions", () => {
        return getProjectExtensions();
    });

    // The licensed render can contain extensions the first one didn't, env vars among them.
    // `applyEnvVars` never overwrites a variable that's already set, so running it again is safe.
    applyEnvVars(projectExtensions);

    const projectConfigValidator = container.resolve(ValidateProjectConfig);
    await traceAsync("validate project extensions", () => {
        return projectConfigValidator.execute(projectExtensions);
    });

    // Initialize project SDK extensions (env vars, hooks, pulumi, implementations, decorators).
    const initProjectSdk = container.resolve(InitProjectSdkService);
    await traceAsync("register project SDK extensions", () => initProjectSdk.execute(container));

    return container;
};
