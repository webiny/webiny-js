import { createImplementation } from "@webiny/di";
import {
    WatchedLambdaFunctionsService,
    LocalStorageService,
    GetApp,
    PulumiGetStackOutputService
} from "~/abstractions/index.js";
import { type AppName } from "~/abstractions/types.js";
import { type ICoreStackOutput } from "~/abstractions/features/GetAppStackOutput.js";

const WATCHED_LAMBDA_FUNCTIONS_KEY = "watchedLambdaFunctions";

interface WatchedLambdaFunctionsData {
    [app: string]: string[]; // app name -> array of Lambda URNs
}

export class DefaultWatchedLambdaFunctionsService
    implements WatchedLambdaFunctionsService.Interface
{
    private cacheKey: Promise<string> | undefined;

    constructor(
        private localStorageService: LocalStorageService.Interface,
        private getApp: GetApp.Interface,
        private pulumiGetStackOutputService: PulumiGetStackOutputService.Interface
    ) {}

    async markDirty(app: AppName, functionUrns: string[]): Promise<void> {
        const key = await this.getCacheKey();
        const data = this.getData(key);

        if (!data[app]) {
            data[app] = [];
        }

        // Add new URNs, avoiding duplicates
        for (const urn of functionUrns) {
            if (!data[app].includes(urn)) {
                data[app].push(urn);
            }
        }

        this.setData(key, data);
    }

    async getDirty(app: AppName): Promise<string[]> {
        const key = await this.getCacheKey();
        const data = this.getData(key);
        return data[app] || [];
    }

    async clearDirty(app: AppName): Promise<void> {
        const key = await this.getCacheKey();
        const data = this.getData(key);
        delete data[app];
        this.setData(key, data);
    }

    async clearAll(): Promise<void> {
        const key = await this.getCacheKey();
        this.setData(key, {});
    }

    private getCacheKey(): Promise<string> {
        if (!this.cacheKey) {
            this.cacheKey = this.resolveCacheKey();
        }

        return this.cacheKey;
    }

    private async resolveCacheKey(): Promise<string> {
        const coreApp = this.getApp.execute("core");
        const coreStackOutput =
            await this.pulumiGetStackOutputService.execute<ICoreStackOutput>(coreApp);
        const deploymentId = coreStackOutput?.deploymentId;

        return deploymentId
            ? `${WATCHED_LAMBDA_FUNCTIONS_KEY}-${deploymentId}`
            : WATCHED_LAMBDA_FUNCTIONS_KEY;
    }

    private getData(key: string): WatchedLambdaFunctionsData {
        const data = this.localStorageService.get(key);
        if (!data) {
            return {};
        }

        try {
            return typeof data === "string" ? JSON.parse(data) : data;
        } catch {
            return {};
        }
    }

    private setData(key: string, data: WatchedLambdaFunctionsData): void {
        this.localStorageService.set(key, data);
    }
}

export const watchedLambdaFunctionsService = createImplementation({
    abstraction: WatchedLambdaFunctionsService,
    implementation: DefaultWatchedLambdaFunctionsService,
    dependencies: [LocalStorageService, GetApp, PulumiGetStackOutputService]
});
