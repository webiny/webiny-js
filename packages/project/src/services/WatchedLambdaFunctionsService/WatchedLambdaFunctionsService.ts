import { createImplementation } from "@webiny/di";
import { WatchedLambdaFunctionsService, LocalStorageService } from "~/abstractions/index.js";

const WATCHED_LAMBDA_FUNCTIONS_KEY = "watchedLambdaFunctions";

interface WatchedLambdaFunctionsData {
    [app: string]: string[]; // app name -> array of Lambda URNs
}

export class DefaultWatchedLambdaFunctionsService
    implements WatchedLambdaFunctionsService.Interface
{
    constructor(private localStorageService: LocalStorageService.Interface) {}

    markDirty(params: WatchedLambdaFunctionsService.Params, functionUrns: string[]): void {
        const key = this.getCacheKey(params);
        const data = this.getData(key);

        if (!data[params.name]) {
            data[params.name] = [];
        }

        // Add new URNs, avoiding duplicates.
        for (const urn of functionUrns) {
            if (!data[params.name].includes(urn)) {
                data[params.name].push(urn);
            }
        }

        this.setData(key, data);
    }

    getDirty(params: WatchedLambdaFunctionsService.Params): string[] {
        const key = this.getCacheKey(params);
        const data = this.getData(key);
        return data[params.name] || [];
    }

    clearDirty(params: WatchedLambdaFunctionsService.Params): void {
        const key = this.getCacheKey(params);
        const data = this.getData(key);
        delete data[params.name];
        this.setData(key, data);
    }

    clearAll(): void {
        this.setData(WATCHED_LAMBDA_FUNCTIONS_KEY, {});
    }

    private getCacheKey(params: WatchedLambdaFunctionsService.Params): string {
        return params.deploymentId
            ? `${WATCHED_LAMBDA_FUNCTIONS_KEY}-${params.deploymentId}`
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
    dependencies: [LocalStorageService]
});
