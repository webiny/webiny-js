import { createImplementation } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { RedirectAfterCreateEventHandler } from "~/features/redirects/CreateRedirect/index.js";
import { InvalidateRedirectsCacheUseCase } from "./abstractions.js";

class RedirectAfterCreateHandlerImpl implements RedirectAfterCreateEventHandler.Interface {
    constructor(
        private invalidateCache: InvalidateRedirectsCacheUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    async handle(event: RedirectAfterCreateEventHandler.Event): Promise<void> {
        const { redirect } = event.payload;

        // Only invalidate cache if the redirect is enabled
        if (!redirect.isEnabled) {
            return;
        }

        // The redirect is already stored, so a failed invalidation is logged, not thrown.
        const result = await this.invalidateCache.execute();
        if (result.isFail()) {
            this.logger.error({ error: result.error }, "Could not invalidate the redirects cache.");
        }
    }
}

export const RedirectAfterCreateCacheHandler = createImplementation({
    abstraction: RedirectAfterCreateEventHandler,
    implementation: RedirectAfterCreateHandlerImpl,
    dependencies: [InvalidateRedirectsCacheUseCase, Logger]
});
