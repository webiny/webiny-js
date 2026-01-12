import { createImplementation } from "@webiny/di";
import { WatchedLambdaFunctionsService, LocalStorageService } from "~/abstractions/index.js";
import { type AppName } from "~/abstractions/types.js";

const WATCHED_LAMBDA_FUNCTIONS_KEY = "watchedLambdaFunctions";

interface WatchedLambdaFunctionsData {
    [app: string]: string[]; // app name -> array of Lambda URNs
}

export class DefaultWatchedLambdaFunctionsService
    implements WatchedLambdaFunctionsService.Interface
{
    constructor(private localStorageService: LocalStorageService.Interface) {}

    markDirty(app: AppName, functionUrns: string[]): void {
        const data = this.getData();

        if (!data[app]) {
            data[app] = [];
        }

        // Add new URNs, avoiding duplicates
        for (const urn of functionUrns) {
            if (!data[app].includes(urn)) {
                data[app].push(urn);
            }
        }

        this.setData(data);
    }

    getDirty(app: AppName): string[] {
        const data = this.getData();
        return data[app] || [];
    }

    clearDirty(app: AppName): void {
        const data = this.getData();
        delete data[app];
        this.setData(data);
    }

    clearAll(): void {
        this.setData({});
    }

    private getData(): WatchedLambdaFunctionsData {
        const data = this.localStorageService.get(WATCHED_LAMBDA_FUNCTIONS_KEY);
        if (!data) {
            return {};
        }

        try {
            return typeof data === "string" ? JSON.parse(data) : data;
        } catch {
            return {};
        }
    }

    private setData(data: WatchedLambdaFunctionsData): void {
        this.localStorageService.set(WATCHED_LAMBDA_FUNCTIONS_KEY, data);
    }
}

export const watchedLambdaFunctionsService = createImplementation({
    abstraction: WatchedLambdaFunctionsService,
    implementation: DefaultWatchedLambdaFunctionsService,
    dependencies: [LocalStorageService]
});
