import {
    DeployApp,
    GetApp,
    LoggerService,
    PulumiGetStackOutputService
} from "~/abstractions/index.js";

/**
 * Decorator that refreshes the stack output cache after successful deployment.
 * This ensures that subsequent calls to get stack output will have fresh data
 * without needing to fetch it from Pulumi.
 */
export class DeployAppRefreshStackOutputCache implements DeployApp.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private logger: LoggerService.Interface,
        private pulumiGetStackOutputService: PulumiGetStackOutputService.Interface,
        private decoratee: DeployApp.Interface
    ) {}

    async execute(params: DeployApp.Params) {
        const result = await this.decoratee.execute(params);

        // Update the stack output cache after successful deployment
        try {
            const app = this.getApp.execute(params.app);
            await this.pulumiGetStackOutputService.execute(app, { skipCache: true });
        } catch (error) {
            // Cache refresh failure shouldn't affect deployment success
            this.logger.error("Failed to update stack output cache after deployment.", error);
        }

        return result;
    }
}

export const deployAppRefreshStackOutputCache = DeployApp.createDecorator({
    decorator: DeployAppRefreshStackOutputCache,
    dependencies: [GetApp, LoggerService, PulumiGetStackOutputService]
});
