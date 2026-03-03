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

    markDirty(app: WatchedLambdaFunctionsService.App, functionUrns: string[]): void {
        const key = this.getCacheKey(app);
        const data = this.getData(key);

        if (!data[app.name]) {
            data[app.name] = [];
        }

        // Add new URNs, avoiding duplicates
        for (const urn of functionUrns) {
            if (!data[app.name].includes(urn)) {
                data[app.name].push(urn);
            }
        }

        this.setData(key, data);
    }

    getDirty(app: WatchedLambdaFunctionsService.App): string[] {
        const key = this.getCacheKey(app);
        const data = this.getData(key);
        return data[app.name] || [];
    }

    clearDirty(app: WatchedLambdaFunctionsService.App): void {
        const key = this.getCacheKey(app);
        const data = this.getData(key);
        delete data[app.name];
        this.setData(key, data);
    }

    clearAll(): void {
        this.setData(WATCHED_LAMBDA_FUNCTIONS_KEY, {});
    }

    private getCacheKey(app: WatchedLambdaFunctionsService.App): string {
        return app.deploymentId
            ? `${WATCHED_LAMBDA_FUNCTIONS_KEY}-${app.deploymentId}`
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
