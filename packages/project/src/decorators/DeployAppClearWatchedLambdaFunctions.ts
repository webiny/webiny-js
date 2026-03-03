import {
    DeployApp,
    GetApp,
    PulumiGetStackOutputService,
    WatchedLambdaFunctionsService
} from "~/abstractions/index.js";
import { type ICoreStackOutput } from "~/abstractions/features/GetAppStackOutput.js";

/**
 * Decorator that clears watched Lambda functions after successful deployment.
 * This ensures Lambda functions that were updated during watch sessions are replaced
 * only once, and not on subsequent deployments.
 */
export class DeployAppClearWatchedLambdaFunctions implements DeployApp.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private pulumiGetStackOutputService: PulumiGetStackOutputService.Interface,
        private watchedLambdaFunctionsService: WatchedLambdaFunctionsService.Interface,
        private decoratee: DeployApp.Interface
    ) {}

    async execute(params: DeployApp.Params) {
        const coreApp = this.getApp.execute("core");
        const coreStackOutput =
            await this.pulumiGetStackOutputService.execute<ICoreStackOutput>(coreApp);
        const deploymentId = coreStackOutput?.deploymentId;

        const result = await this.decoratee.execute(params);

        // Clear Lambda URNs that needed replacement after successful deployment
        const app = this.getApp.execute(params.app);
        this.watchedLambdaFunctionsService.clearDirty({ name: app.name, deploymentId });

        return result;
    }
}

export const deployAppClearWatchedLambdaFunctions = DeployApp.createDecorator({
    decorator: DeployAppClearWatchedLambdaFunctions,
    dependencies: [GetApp, PulumiGetStackOutputService, WatchedLambdaFunctionsService]
});
