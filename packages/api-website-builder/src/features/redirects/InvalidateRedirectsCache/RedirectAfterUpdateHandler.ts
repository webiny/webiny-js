import { createImplementation } from "@webiny/feature/api";
import { RedirectAfterUpdateEventHandler } from "~/features/redirects/UpdateRedirect/index.js";
import { InvalidateRedirectsCacheUseCase } from "./abstractions.js";

class RedirectAfterUpdateHandlerImpl implements RedirectAfterUpdateEventHandler.Interface {
    constructor(private invalidateCache: InvalidateRedirectsCacheUseCase.Interface) {}

    async handle(event: RedirectAfterUpdateEventHandler.Event): Promise<void> {
        const { redirect, original } = event.payload;

        // Invalidate the CDN cache when any field the `/wb/redirects` response exposes has changed.
        // That response is served with `max-age=31536000`, so a field omitted here means up to a
        // year of stale data. Keep this list in sync with `ActiveRedirectRestMapper.toDto` (plus
        // `isEnabled`, which decides whether the redirect appears in the response at all).
        if (
            redirect.redirectFrom !== original.redirectFrom ||
            redirect.redirectTo !== original.redirectTo ||
            redirect.redirectType !== original.redirectType ||
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
