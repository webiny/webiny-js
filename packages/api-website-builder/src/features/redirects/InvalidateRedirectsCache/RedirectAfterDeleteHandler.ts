import { createImplementation } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { RedirectAfterDeleteEventHandler } from "~/features/redirects/DeleteRedirect/index.js";
import { InvalidateRedirectsCacheUseCase } from "./abstractions.js";

class RedirectAfterDeleteHandlerImpl implements RedirectAfterDeleteEventHandler.Interface {
    constructor(
        private invalidateCache: InvalidateRedirectsCacheUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    async handle(event: RedirectAfterDeleteEventHandler.Event): Promise<void> {
        const { redirect } = event.payload;

        // Only invalidate cache if the redirect was enabled
        if (!redirect.isEnabled) {
            return;
        }

        // The redirect is already deleted, so a failed invalidation is logged, not thrown.
        const result = await this.invalidateCache.execute();
        if (result.isFail()) {
            this.logger.error({ error: result.error }, "Could not invalidate the redirects cache.");
        }
    }
}

export const RedirectAfterDeleteCacheHandler = createImplementation({
    abstraction: RedirectAfterDeleteEventHandler,
    implementation: RedirectAfterDeleteHandlerImpl,
    dependencies: [InvalidateRedirectsCacheUseCase, Logger]
});
