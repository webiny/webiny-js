import { createFeature } from "@webiny/feature/api";
import { ManifestPublicUrls } from "./ManifestPublicUrls.js";

export const ManifestPublicUrlsFeature = createFeature({
    name: "ManifestPublicUrlsFeature",
    register(container) {
        container.register(ManifestPublicUrls);
    }
});
