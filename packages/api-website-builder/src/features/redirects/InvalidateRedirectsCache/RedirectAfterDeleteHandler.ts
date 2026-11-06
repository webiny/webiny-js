import { createImplementation } from "@webiny/feature/api";
import { RedirectAfterDeleteEventHandler } from "~/features/redirects/DeleteRedirect/index.js";
import { InvalidateRedirectsCacheUseCase } from "./abstractions.js";

class RedirectAfterDeleteHandlerImpl implements RedirectAfterDeleteEventHandler.Interface {
    constructor(private invalidateCache: InvalidateRedirectsCacheUseCase.Interface) {}

    async handle(event: RedirectAfterDeleteEventHandler.Event): Promise<void> {
        const { redirect } = event.payload;

        // Only invalidate cache if the redirect was enabled
        if (redirect.isEnabled) {
            await this.invalidateCache.execute();
        }
    }
}

export const RedirectAfterDeleteCacheHandler = createImplementation({
    abstraction: RedirectAfterDeleteEventHandler,
    implementation: RedirectAfterDeleteHandlerImpl,
    dependencies: [InvalidateRedirectsCacheUseCase]
});
