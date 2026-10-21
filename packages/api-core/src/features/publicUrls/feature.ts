import { createFeature } from "@webiny/feature/api";
import { NullPublicUrls } from "./NullPublicUrls.js";

/**
 * Registers the default, which knows no URLs. Each hosting type overrides it through the
 * `publicUrls` hook of `registerApiRequestStack`.
 */
export const PublicUrlsFeature = createFeature({
    name: "PublicUrlsFeature",
    register(container) {
        container.register(NullPublicUrls);
    }
});
