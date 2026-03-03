import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type AppName } from "~/abstractions/types.js";

export interface IWatchedLambdaFunctionsServiceApp {
    name: AppName;
    deploymentId?: string;
}

export interface IWatchedLambdaFunctionsService {
    /**
     * Mark Lambda functions as needing replacement on next deployment
     */
    markDirty(app: IWatchedLambdaFunctionsServiceApp, functionUrns: string[]): void;

    /**
     * Get list of Lambda function URNs that need replacement for an app
     */
    getDirty(app: IWatchedLambdaFunctionsServiceApp): string[];

    /**
     * Clear Lambda functions that need replacement for an app
     */
    clearDirty(app: IWatchedLambdaFunctionsServiceApp): void;

    /**
     * Clear all Lambda functions that need replacement across all apps
     */
    clearAll(): void;
}

export const WatchedLambdaFunctionsService = createAbstraction<IWatchedLambdaFunctionsService>(
    "WatchedLambdaFunctionsService"
);

export namespace WatchedLambdaFunctionsService {
    export type Interface = IWatchedLambdaFunctionsService;
    export type App = IWatchedLambdaFunctionsServiceApp;
}
