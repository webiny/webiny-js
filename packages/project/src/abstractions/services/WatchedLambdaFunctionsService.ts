import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type AppName } from "~/abstractions/types.js";

export interface IWatchedLambdaFunctionsServiceParams {
    name: AppName;
    deploymentId?: string;
}

export interface IWatchedLambdaFunctionsService {
    /**
     * Mark Lambda functions as needing replacement on next deployment.
     */
    markDirty(params: IWatchedLambdaFunctionsServiceParams, functionUrns: string[]): void;

    /**
     * Get list of Lambda function URNs that need replacement for an app.
     */
    getDirty(params: IWatchedLambdaFunctionsServiceParams): string[];

    /**
     * Clear Lambda functions that need replacement for an app.
     */
    clearDirty(params: IWatchedLambdaFunctionsServiceParams): void;

    /**
     * Clear all Lambda functions that need replacement across all apps.
     */
    clearAll(): void;
}

export const WatchedLambdaFunctionsService = createAbstraction<IWatchedLambdaFunctionsService>(
    "WatchedLambdaFunctionsService"
);

export namespace WatchedLambdaFunctionsService {
    export type Interface = IWatchedLambdaFunctionsService;
    export type Params = IWatchedLambdaFunctionsServiceParams;
}
