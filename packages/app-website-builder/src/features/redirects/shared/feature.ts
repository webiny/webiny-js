import { createFeature } from "@webiny/feature/admin";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { RedirectsListCache } from "./abstractions.js";
import type { Redirect } from "~/domain/Redirect/Redirect.js";

export const SharedRedirectCacheFeature = createFeature({
    name: "WebsiteBuilder/SharedRedirectCache",
    register(container) {
        container.registerInstance(RedirectsListCache, new ListCache<Redirect>());
    },
    resolve(container) {
        return {
            cache: container.resolve(RedirectsListCache)
        };
    }
});
