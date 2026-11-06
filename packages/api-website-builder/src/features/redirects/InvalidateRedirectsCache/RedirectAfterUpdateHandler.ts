import { createImplementation } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { RedirectAfterUpdateEventHandler } from "~/features/redirects/UpdateRedirect/index.js";
import { InvalidateRedirectsCacheUseCase } from "./abstractions.js";

class RedirectAfterUpdateHandlerImpl implements RedirectAfterUpdateEventHandler.Interface {
    constructor(
        private invalidateCache: InvalidateRedirectsCacheUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    async handle(event: RedirectAfterUpdateEventHandler.Event): Promise<void> {
        const { redirect, original } = event.payload;

        // Invalidate cache if any redirect-related field changed or isEnabled changed
        const changed =
            redirect.redirectFrom !== original.redirectFrom ||
            redirect.redirectTo !== original.redirectTo ||
            redirect.isEnabled !== original.isEnabled;
        if (!changed) {
            return;
        }

        // The redirect is already stored, so a failed invalidation is logged, not thrown.
        const result = await this.invalidateCache.execute();
        if (result.isFail()) {
            this.logger.error({ error: result.error }, "Could not invalidate the redirects cache.");
        }
    }
}

export const RedirectAfterUpdateCacheHandler = createImplementation({
    abstraction: RedirectAfterUpdateEventHandler,
    implementation: RedirectAfterUpdateHandlerImpl,
    dependencies: [InvalidateRedirectsCacheUseCase, Logger]
});
