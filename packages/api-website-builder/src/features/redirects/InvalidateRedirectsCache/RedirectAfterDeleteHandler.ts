import { createImplementation } from "@webiny/feature/api";
import { RedirectAfterDeleteHandler } from "~/features/redirects/DeleteRedirect/index.js";
import { InvalidateRedirectsCacheUseCase } from "./abstractions.js";

class RedirectAfterDeleteHandlerImpl implements RedirectAfterDeleteHandler.Interface {
    constructor(private invalidateCache: InvalidateRedirectsCacheUseCase.Interface) {}

    async handle(event: RedirectAfterDeleteHandler.Event): Promise<void> {
        const { redirect } = event.payload;

        // Only invalidate cache if the redirect was enabled
        if (redirect.isEnabled) {
            await this.invalidateCache.execute();
        }
    }
}

export const RedirectAfterDeleteCacheHandler = createImplementation({
    abstraction: RedirectAfterDeleteHandler,
    implementation: RedirectAfterDeleteHandlerImpl,
    dependencies: [InvalidateRedirectsCacheUseCase]
});
