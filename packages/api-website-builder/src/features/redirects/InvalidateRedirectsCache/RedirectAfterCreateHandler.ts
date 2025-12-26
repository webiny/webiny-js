import { createImplementation } from "@webiny/feature/api";
import { RedirectAfterCreateHandler } from "~/features/redirects/CreateRedirect/index.js";
import { InvalidateRedirectsCacheUseCase } from "./abstractions.js";

class RedirectAfterCreateHandlerImpl implements RedirectAfterCreateHandler.Interface {
    constructor(private invalidateCache: InvalidateRedirectsCacheUseCase.Interface) {}

    async handle(event: RedirectAfterCreateHandler.Event): Promise<void> {
        const { redirect } = event.payload;

        // Only invalidate cache if the redirect is enabled
        if (redirect.isEnabled) {
            await this.invalidateCache.execute();
        }
    }
}

export const RedirectAfterCreateCacheHandler = createImplementation({
    abstraction: RedirectAfterCreateHandler,
    implementation: RedirectAfterCreateHandlerImpl,
    dependencies: [InvalidateRedirectsCacheUseCase]
});
