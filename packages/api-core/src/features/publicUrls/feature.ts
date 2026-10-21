import { createFeature } from "@webiny/feature/api";
import { NullPublicUrls } from "./NullPublicUrls.js";
import { ManifestPublicUrls } from "./ManifestPublicUrls.js";
import { BuildParamsPublicUrls } from "./BuildParamsPublicUrls.js";

/** Registers the null default. Hosting types override it with one of the features below. */
export const PublicUrlsFeature = createFeature({
    name: "PublicUrlsFeature",
    register(container) {
        container.register(NullPublicUrls);
    }
});

export const ManifestPublicUrlsFeature = createFeature({
    name: "ManifestPublicUrlsFeature",
    register(container) {
        container.register(ManifestPublicUrls);
    }
});

export const BuildParamsPublicUrlsFeature = createFeature({
    name: "BuildParamsPublicUrlsFeature",
    register(container) {
        container.register(BuildParamsPublicUrls);
    }
});
