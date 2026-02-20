import { DeployApp, GetApp, WatchedLambdaFunctionsService } from "~/abstractions/index.js";

/**
 * Decorator that clears watched Lambda functions after successful deployment.
 * This ensures Lambda functions that were updated during watch sessions are replaced
 * only once, and not on subsequent deployments.
 */
export class DeployAppClearWatchedLambdaFunctions implements DeployApp.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private watchedLambdaFunctionsService: WatchedLambdaFunctionsService.Interface,
        private decoratee: DeployApp.Interface
    ) {}

    async execute(params: DeployApp.Params) {
        const result = await this.decoratee.execute(params);

        // Clear Lambda URNs that needed replacement after successful deployment
        const app = this.getApp.execute(params.app);
        await this.watchedLambdaFunctionsService.clearDirty(app.name);

        return result;
    }
}

export const deployAppClearWatchedLambdaFunctions = DeployApp.createDecorator({
    decorator: DeployAppClearWatchedLambdaFunctions,
    dependencies: [GetApp, WatchedLambdaFunctionsService]
});
