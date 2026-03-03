import {
    DeployApp,
    GetApp,
    PulumiGetStackOutputService,
    WatchedLambdaFunctionsService
} from "~/abstractions/index.js";
import { type ICoreStackOutput } from "~/abstractions/features/GetAppStackOutput.js";

/**
 * Decorator that injects watched Lambda function URNs into Pulumi replace args.
 * This ensures Lambda functions that were updated during watch sessions are
 * replaced during deployment.
 */
export class DeployAppWithWatchedLambdaReplacement implements DeployApp.Interface {
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

        const app = this.getApp.execute(params.app);
        const lambdaUrnsToReplace = this.watchedLambdaFunctionsService.getDirty({
            name: app.name,
            deploymentId
        });

        // Inject replace URNs into pulumiArgs if any exist
        const enhancedParams = {
            ...params,
            pulumiArgs: {
                ...params.pulumiArgs,
                replace: lambdaUrnsToReplace.length > 0 ? lambdaUrnsToReplace : undefined
            }
        };

        return this.decoratee.execute(enhancedParams);
    }
}

export const deployAppWithWatchedLambdaReplacement = DeployApp.createDecorator({
    decorator: DeployAppWithWatchedLambdaReplacement,
    dependencies: [GetApp, PulumiGetStackOutputService, WatchedLambdaFunctionsService]
});
