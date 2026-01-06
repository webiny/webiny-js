import { createImplementation } from "@webiny/di";
import {
    GetPulumiService,
    GetProjectService,
    LoggerService,
    PulumiGetStackOutputService,
    PulumiSelectStackService,
    ProjectSdkParamsService
} from "~/abstractions/index.js";
import { type AppModel } from "~/models/index.js";
import { createEnvConfiguration, withPulumiConfigPassphrase } from "~/utils/env/index.js";
import { mapStackOutput } from "./mapStackOutput.js";
import fs from "fs/promises";
import path from "path";

export class DefaultPulumiGetStackOutputService implements PulumiGetStackOutputService.Interface {
    private static readonly DEFAULT_ENV = "dev";
    private static readonly DEFAULT_REGION = "default";
    private static readonly DEFAULT_VARIANT = "default";

    constructor(
        private getPulumiService: GetPulumiService.Interface,
        private pulumiSelectStackService: PulumiSelectStackService.Interface,
        private loggerService: LoggerService.Interface,
        private getProjectService: GetProjectService.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface
    ) {}

    async execute(app: AppModel, params?: PulumiGetStackOutputService.Params) {
        // Try to read from cache if skipCache is not true
        if (!params?.skipCache) {
            const cachedOutput = await this.readFromCache(app);
            if (cachedOutput !== null) {
                return this.applyMapping(cachedOutput, params?.map);
            }
        }

        const pulumi = await this.getPulumiService.execute({ app });

        await this.pulumiSelectStackService.execute(app);

        const stackOutputString = await pulumi.run({
            command: ["stack", "output"],
            args: {
                json: true
            },
            execa: {
                env: createEnvConfiguration({
                    configurations: [withPulumiConfigPassphrase()]
                })
            }
        });

        try {
            const stackOutputJson = JSON.parse(stackOutputString.stdout);
            if (!stackOutputJson) {
                return null;
            }

            // Write to cache
            await this.writeToCache(app, stackOutputJson);

            return this.applyMapping(stackOutputJson, params?.map);
        } catch {
            this.loggerService.error(
                "Could not parse stack output as JSON.",
                stackOutputString.stdout,
                app,
                params
            );
            return null;
        }
    }

    private applyMapping(data: Record<string, any>, map?: Record<string, any>): Record<string, any> {
        if (!map) {
            return data;
        }
        // If a mapping is provided, we map the output to the specified structure.
        return mapStackOutput(data, map);
    }

    private getCacheKey(app: AppModel): string {
        const sdkParams = this.projectSdkParamsService.get();
        const env = sdkParams.env || DefaultPulumiGetStackOutputService.DEFAULT_ENV;
        const region = sdkParams.region || DefaultPulumiGetStackOutputService.DEFAULT_REGION;
        const variant = sdkParams.variant || DefaultPulumiGetStackOutputService.DEFAULT_VARIANT;
        return `${app.name}-${env}-${region}-${variant}.json`;
    }

    private getCachePath(app: AppModel): string {
        const project = this.getProjectService.execute();
        const cacheDir = project.paths.dotWebinyFolder.join("caches", "stack-output").toString();
        const cacheKey = this.getCacheKey(app);
        return path.join(cacheDir, cacheKey);
    }

    private async readFromCache(app: AppModel): Promise<Record<string, any> | null> {
        const cachePath = this.getCachePath(app);

        try {
            const content = await fs.readFile(cachePath, "utf-8");
            return JSON.parse(content);
        } catch (error) {
            // File doesn't exist or couldn't be read/parsed - this is expected on first run
            return null;
        }
    }

    private async writeToCache(app: AppModel, data: Record<string, any>): Promise<void> {
        const cachePath = this.getCachePath(app);
        const cacheDir = path.dirname(cachePath);

        try {
            // Create cache directory if it doesn't exist
            await fs.mkdir(cacheDir, { recursive: true });
            await fs.writeFile(cachePath, JSON.stringify(data, null, 2), "utf-8");
        } catch (error) {
            this.loggerService.error("Could not write to cache file.", cachePath, error);
        }
    }
}

export const pulumiGetStackOutputService = createImplementation({
    abstraction: PulumiGetStackOutputService,
    implementation: DefaultPulumiGetStackOutputService,
    dependencies: [GetPulumiService, PulumiSelectStackService, LoggerService, GetProjectService, ProjectSdkParamsService]
});
