import { type Container } from "@webiny/di";
import { createProjectSdkContainer } from "./createProjectSdkContainer.js";
import { BuildApp } from "~/abstractions/index.js";
import { GetApp } from "~/abstractions/index.js";
import { GetFeatureFlags } from "~/abstractions/index.js";
import { GetProductionEnvironments } from "~/abstractions/index.js";
import { GetProject } from "~/abstractions/index.js";
import { GetProjectIdService } from "~/abstractions/index.js";
import { GetProjectInstallationIdService } from "~/abstractions/index.js";
import { SetProjectIdService } from "~/abstractions/index.js";
import { GetProjectConfig } from "~/abstractions/index.js";
import { GetProjectInfo } from "~/abstractions/index.js";
import { InstallExtension } from "~/abstractions/index.js";
import { IsCi } from "~/abstractions/index.js";
import { IsTelemetryEnabled } from "~/abstractions/index.js";
import { LocalStorageService } from "~/abstractions/index.js";
import { LoggerService } from "~/abstractions/index.js";
import { type ProjectSdkParamsService } from "~/abstractions/index.js";
import { ValidateProjectConfig } from "~/abstractions/index.js";
import { Watch } from "~/abstractions/index.js";
import { Serve } from "~/abstractions/index.js";
import { WcpService } from "~/abstractions/index.js";
import { GetProjectVersionService } from "~/abstractions/index.js";
import {
    isValidRegionName,
    isValidVariantName,
    getProjectSdkContextFromEnv
} from "./utils/index.js";

const projectSdkCache = new Map<string, ProjectSdk>();

export class ProjectSdk {
    container: Container;

    protected constructor(container: Container) {
        this.container = container;
    }

    static async init(
        params: Partial<ProjectSdkParamsService.Params> = {},
        register?: (container: Container) => void
    ) {
        // If no params provided, check if we have context from parent process via env var
        const envContext = getProjectSdkContextFromEnv();
        if (envContext && Object.keys(params).length === 0) {
            params = envContext;
        }

        const cacheKey = ProjectSdk.getCacheKey(params, register);

        if (projectSdkCache.has(cacheKey)) {
            return projectSdkCache.get(cacheKey)!;
        }

        const container = await createProjectSdkContainer(params, register);
        const instance = new ProjectSdk(container);
        projectSdkCache.set(cacheKey, instance);

        return instance;
    }

    private static getCacheKey(
        params: Partial<ProjectSdkParamsService.Params>,
        register?: (container: Container) => void
    ): string {
        const env = params.env || "";
        const variant = params.variant || "";
        const region = params.region || "";
        const hostingType = register?.name || "";
        return `${env}:${variant}:${region}:${hostingType}`;
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
    getProjectInstallationId() {
        return this.container.resolve(GetProjectInstallationIdService).execute();
    }

    getProjectInfo() {
        return this.container.resolve(GetProjectInfo).execute();
    }

    getFeatureFlags() {
        return this.container.resolve(GetFeatureFlags).execute();
    }

    // App-related methods.
    async getApp(appName: GetApp.Params) {
        return this.container.resolve(GetApp).execute(appName);
    }

    buildApp(params: BuildApp.Params) {
        return this.container.resolve(BuildApp).execute(params);
    }

    watch(params: Watch.Params) {
        return this.container.resolve(Watch).execute(params);
    }

    serve(params: Serve.Params) {
        return this.container.resolve(Serve).execute(params);
    }

    get wcp() {
        return this.container.resolve(WcpService);
    }

    get localStorage() {
        return this.container.resolve(LocalStorageService);
    }

    getProductionEnvironments() {
        return this.container.resolve(GetProductionEnvironments).execute();
    }

    installExtension(source: string) {
        return this.container.resolve(InstallExtension).execute(source);
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
