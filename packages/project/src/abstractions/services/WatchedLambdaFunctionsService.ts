import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type AppName } from "~/abstractions/types.js";

export interface IWatchedLambdaFunctionsService {
    /**
     * Mark Lambda functions as needing replacement on next deployment
     */
    markDirty(app: AppName, functionUrns: string[]): Promise<void>;

    /**
     * Get list of Lambda function URNs that need replacement for an app
     */
    getDirty(app: AppName): Promise<string[]>;

    /**
     * Clear Lambda functions that need replacement for an app
     */
    clearDirty(app: AppName): Promise<void>;

    /**
     * Clear all Lambda functions that need replacement across all apps
     */
    clearAll(): Promise<void>;
}

export const WatchedLambdaFunctionsService = createAbstraction<IWatchedLambdaFunctionsService>(
    "WatchedLambdaFunctionsService"
);

export namespace WatchedLambdaFunctionsService {
    export type Interface = IWatchedLambdaFunctionsService;
}
