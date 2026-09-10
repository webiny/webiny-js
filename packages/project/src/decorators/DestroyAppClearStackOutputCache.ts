import {
    DestroyApp,
    GetApp,
    LoggerService,
    StackOutputCacheService
} from "~/abstractions/index.js";

/**
 * Decorator that clears the stack output cache when an app is destroyed.
 *
 * Without this, the cache file written during deploy would remain on disk after a
 * destroy, and a subsequent deploy (or any stack output read) would use it and behave
 * as if the stack were still deployed.
 *
 * The cache is cleared before the destroy runs. Since the cache is only a performance
 * optimization, this is safe even if the destroy fails and the stack remains: the next
 * read simply fetches fresh output from Pulumi again.
 */
export class DestroyAppClearStackOutputCache implements DestroyApp.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private logger: LoggerService.Interface,
        private stackOutputCacheService: StackOutputCacheService.Interface,
        private decoratee: DestroyApp.Interface
    ) {}

    async execute(params: DestroyApp.Params) {
        try {
            const app = this.getApp.execute(params.app);
            await this.stackOutputCacheService.delete(app);
        } catch (error) {
            // Cache clearing failure shouldn't prevent the destroy from running.
            this.logger.error("Failed to clear stack output cache before destroy.", error);
        }

        return this.decoratee.execute(params);
    }
}

export const destroyAppClearStackOutputCache = DestroyApp.createDecorator({
    decorator: DestroyAppClearStackOutputCache,
    dependencies: [GetApp, LoggerService, StackOutputCacheService]
});
