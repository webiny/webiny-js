import { DeployApp, GetApp, WatchedLambdaFunctionsService } from "~/abstractions/index.js";

/**
 * Decorator that injects watched Lambda function URNs into Pulumi replace args.
 * This ensures Lambda functions that were updated during watch sessions are
 * replaced during deployment.
 */
export class DeployAppWithWatchedLambdaReplacement implements DeployApp.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private watchedLambdaFunctionsService: WatchedLambdaFunctionsService.Interface,
        private decoratee: DeployApp.Interface
    ) {}

    async execute(params: DeployApp.Params) {
        const app = this.getApp.execute(params.app);
        const lambdaUrnsToReplace = this.watchedLambdaFunctionsService.getDirty(app.name);

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
    dependencies: [GetApp, WatchedLambdaFunctionsService]
});
