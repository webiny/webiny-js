import { createImplementation } from "@webiny/feature/api";
import { RedirectAfterCreateEventHandler } from "~/features/redirects/CreateRedirect/index.js";
import { InvalidateRedirectsCacheUseCase } from "./abstractions.js";

class RedirectAfterCreateHandlerImpl implements RedirectAfterCreateEventHandler.Interface {
    constructor(private invalidateCache: InvalidateRedirectsCacheUseCase.Interface) {}

    async handle(event: RedirectAfterCreateEventHandler.Event): Promise<void> {
        const { redirect } = event.payload;

        // Only invalidate cache if the redirect is enabled
        if (redirect.isEnabled) {
            await this.invalidateCache.execute();
        }
    }
}

export const RedirectAfterCreateCacheHandler = createImplementation({
    abstraction: RedirectAfterCreateEventHandler,
    implementation: RedirectAfterCreateHandlerImpl,
    dependencies: [InvalidateRedirectsCacheUseCase]
});
