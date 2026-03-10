import { createImplementation } from "@webiny/feature/api";
import { RedirectAfterUpdateEventHandler } from "~/features/redirects/UpdateRedirect/index.js";
import { InvalidateRedirectsCacheUseCase } from "./abstractions.js";

class RedirectAfterUpdateHandlerImpl implements RedirectAfterUpdateEventHandler.Interface {
    constructor(private invalidateCache: InvalidateRedirectsCacheUseCase.Interface) {}

    async handle(event: RedirectAfterUpdateEventHandler.Event): Promise<void> {
        const { redirect, original } = event.payload;

        // Invalidate cache if any redirect-related field changed or isEnabled changed
        if (
            redirect.redirectFrom !== original.redirectFrom ||
            redirect.redirectTo !== original.redirectTo ||
            redirect.isEnabled !== original.isEnabled
        ) {
            await this.invalidateCache.execute();
        }
    }
}

export const RedirectAfterUpdateCacheHandler = createImplementation({
    abstraction: RedirectAfterUpdateEventHandler,
    implementation: RedirectAfterUpdateHandlerImpl,
    dependencies: [InvalidateRedirectsCacheUseCase]
});
