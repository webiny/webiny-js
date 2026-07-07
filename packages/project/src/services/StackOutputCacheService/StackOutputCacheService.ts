import { createImplementation } from "@webiny/di";
import {
    GetProjectService,
    LoggerService,
    ProjectSdkParamsService,
    StackOutputCacheService
} from "~/abstractions/index.js";
import { type AppModel } from "~/models/index.js";
import fs from "fs/promises";
import path from "path";

export class DefaultStackOutputCacheService implements StackOutputCacheService.Interface {
    private static readonly DEFAULT_ENV = "dev";
    private static readonly DEFAULT_REGION = "default";
    private static readonly DEFAULT_VARIANT = "default";

    constructor(
        private getProjectService: GetProjectService.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface,
        private loggerService: LoggerService.Interface
    ) {}

    async read(app: AppModel): Promise<Record<string, any> | null> {
        const cachePath = this.getCachePath(app);

        try {
            const content = await fs.readFile(cachePath, "utf-8");
            const data = JSON.parse(content);
            this.loggerService.debug(
                { app: app.name, cacheKey: this.getCacheKey(app) },
                "Stack output read from cache"
            );
            return data;
        } catch {
            // File doesn't exist or couldn't be read/parsed - this is expected on first run.
            return null;
        }
    }

    async write(app: AppModel, data: Record<string, any>): Promise<void> {
        const cachePath = this.getCachePath(app);
        const cacheDir = path.dirname(cachePath);

        try {
            // Create cache directory if it doesn't exist.
            await fs.mkdir(cacheDir, { recursive: true });
            await fs.writeFile(cachePath, JSON.stringify(data, null, 2), "utf-8");
            this.loggerService.debug("Stack output stored to cache", {
                app: app.name,
                cacheKey: this.getCacheKey(app)
            });
        } catch (error) {
            this.loggerService.error("Could not write to cache file.", cachePath, error);
        }
    }

    async delete(app: AppModel): Promise<void> {
        const cachePath = this.getCachePath(app);

        try {
            // `force: true` makes this a no-op if the cache file doesn't exist.
            await fs.rm(cachePath, { force: true });
            this.loggerService.debug("Stack output cache deleted.", {
                app: app.name,
                cacheKey: this.getCacheKey(app)
            });
        } catch (error) {
            this.loggerService.error("Could not delete stack output cache file.", cachePath, error);
        }
    }

    private getCacheKey(app: AppModel): string {
        const sdkParams = this.projectSdkParamsService.get();
        const env = sdkParams.env || DefaultStackOutputCacheService.DEFAULT_ENV;
        const region = sdkParams.region || DefaultStackOutputCacheService.DEFAULT_REGION;
        const variant = sdkParams.variant || DefaultStackOutputCacheService.DEFAULT_VARIANT;
        return `${app.name}-${env}-${region}-${variant}.json`;
    }

    private getCachePath(app: AppModel): string {
        const project = this.getProjectService.execute();
        const cacheDir = project.paths.dotWebinyFolder.join("caches", "stack-output").toString();
        const cacheKey = this.getCacheKey(app);
        return path.join(cacheDir, cacheKey);
    }
}

export const stackOutputCacheService = createImplementation({
    abstraction: StackOutputCacheService,
    implementation: DefaultStackOutputCacheService,
    dependencies: [GetProjectService, ProjectSdkParamsService, LoggerService]
});
