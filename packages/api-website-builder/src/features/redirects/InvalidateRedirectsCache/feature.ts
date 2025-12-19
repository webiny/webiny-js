import { createFeature } from "@webiny/feature/api";
import { InvalidateRedirectsCacheUseCase } from "./InvalidateRedirectsCacheUseCase.js";
import { RedirectAfterCreateCacheHandler } from "./RedirectAfterCreateHandler.js";
import { RedirectAfterUpdateCacheHandler } from "./RedirectAfterUpdateHandler.js";
import { RedirectAfterDeleteCacheHandler } from "./RedirectAfterDeleteHandler.js";

export const InvalidateRedirectsCacheFeature = createFeature({
    name: "WebsiteBuilder/InvalidateRedirectsCache",
    register(container) {
        container.register(InvalidateRedirectsCacheUseCase);
        container.register(RedirectAfterCreateCacheHandler);
        container.register(RedirectAfterUpdateCacheHandler);
        container.register(RedirectAfterDeleteCacheHandler);
    }
});
