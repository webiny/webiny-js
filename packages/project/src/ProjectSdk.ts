import { type Container } from "@webiny/di";
import { createProjectSdkContainer } from "./createProjectSdkContainer.js";
import {
    BuildApp,
    DeployApp,
    DestroyApp,
    GetApp,
    GetAppOutput,
    GetAppStackExport,
    GetAppStackOutput,
    GetProductionEnvironments,
    GetProject,
    GetProjectIdService,
    SetProjectIdService,
    GetProjectConfig,
    GetProjectInfo,
    GetPulumiResourceNamePrefix,
    IsCi,
    IsTelemetryEnabled,
    LocalStorageService,
    LoggerService,
    type ProjectSdkParamsService,
    RefreshApp,
    RunPulumiCommand,
    ValidateProjectConfig,
    ListDeployedEnvironmentsService,
    Watch,
    WcpService,
    GetProjectVersionService
} from "~/abstractions/index.js";
import { type AppName } from "~/abstractions/types.js";
import { isValidRegionName, isValidVariantName } from "./utils/index.js";

const projectSdkCache = new Map<string, ProjectSdk>();

export class ProjectSdk {
    container: Container;

    protected constructor(container: Container) {
        this.container = container;
    }

    static async init(params: Partial<ProjectSdkParamsService.Params> = {}) {
        const cacheKey = ProjectSdk.getCacheKey(params);

        if (projectSdkCache.has(cacheKey)) {
            return projectSdkCache.get(cacheKey)!;
        }

        const container = await createProjectSdkContainer(params);
        const instance = new ProjectSdk(container);
        projectSdkCache.set(cacheKey, instance);

        return instance;
    }

    private static getCacheKey(params: Partial<ProjectSdkParamsService.Params>): string {
        const env = params.env || "";
        const variant = params.variant || "";
        const region = params.region || "";
        return `${env}:${variant}:${region}`;
    }

    // Project-related methods.
    getProject() {
        return this.container.resolve(GetProject).execute();
    }

    getProjectConfig(params?: GetProjectConfig.Params) {
        return this.container.resolve(GetProjectConfig).execute(params);
    }

    validateProjectConfig(projectConfig: ValidateProjectConfig.Params) {
        return this.container.resolve(ValidateProjectConfig).execute(projectConfig);
    }

    async getProjectId() {
        return this.container.resolve(GetProjectIdService).execute();
    }
    async setProjectId(projectId: string, options: SetProjectIdService.Options = {}) {
        return this.container.resolve(SetProjectIdService).execute(projectId, options);
    }
    getProjectVersion() {
        return this.container.resolve(GetProjectVersionService).execute();
    }

    getProjectInfo() {
        return this.container.resolve(GetProjectInfo).execute();
    }

    // App-related methods.
    async getApp(appName: GetApp.Params) {
        return this.container.resolve(GetApp).execute(appName);
    }

    // Here we have two stack output methods. Both do the same thing, but one is returning
    // raw Pulumi output, while the other is returning a JSON, which is far more suitable
    // in multiple places throughout the codebase (like Pulumi code, deploy hooks, ...).
    // TODO: we could probably merge these two methods into one, and have an option to return
    // TODO: raw or JSON output. For now, just writing it here.
    async getAppOutput(params: GetAppOutput.Params) {
        return this.container.resolve(GetAppOutput).execute(params);
    }

    async getAppStackOutput<
        TOutput extends GetAppStackOutput.StackOutput = GetAppStackOutput.StackOutput
    >(appName: AppName) {
        return this.container.resolve(GetAppStackOutput).execute<TOutput>(appName);
    }

    async getAppStackExport<
        TExport extends GetAppStackExport.StackExport = GetAppStackExport.StackExport
    >(params: GetAppStackExport.Params) {
        return this.container.resolve(GetAppStackExport).execute<TExport>(params);
    }

    buildApp(params: BuildApp.Params) {
        return this.container.resolve(BuildApp).execute(params);
    }

    deployApp(params: DeployApp.Params) {
        return this.container.resolve(DeployApp).execute(params);
    }

    destroyApp(params: DestroyApp.Params) {
        return this.container.resolve(DestroyApp).execute(params);
    }

    refreshApp(params: RefreshApp.Params) {
        return this.container.resolve(RefreshApp).execute(params);
    }

    runPulumiCommand(params: RunPulumiCommand.Params) {
        return this.container.resolve(RunPulumiCommand).execute(params);
    }

    watch(params: Watch.Params) {
        return this.container.resolve(Watch).execute(params);
    }

    get wcp() {
        return this.container.resolve(WcpService);
    }

    get localStorage() {
        return this.container.resolve(LocalStorageService);
    }

    getPulumiResourceNamePrefix() {
        return this.container.resolve(GetPulumiResourceNamePrefix).execute();
    }

    getProductionEnvironments() {
        return this.container.resolve(GetProductionEnvironments).execute();
    }

    listDeployedEnvironments() {
        return this.container.resolve(ListDeployedEnvironmentsService).execute();
    }

    // Utility methods.
    isValidRegionName(name?: string) {
        return isValidRegionName(name);
    }

    isValidVariantName(name?: string) {
        return isValidVariantName(name);
    }

    isTelemetryEnabled() {
        return this.container.resolve(IsTelemetryEnabled).execute();
    }

    isCi() {
        return this.container.resolve(IsCi).execute();
    }

    getLogger() {
        return this.container.resolve(LoggerService);
    }

    getContainer() {
        return this.container;
    }
}
