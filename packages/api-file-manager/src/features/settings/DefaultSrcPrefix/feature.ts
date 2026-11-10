import { createFeature } from "@webiny/feature/api";
import { PublicUrlsDefaultSrcPrefix } from "./PublicUrlsDefaultSrcPrefix.js";

export const DefaultSrcPrefixFeature = createFeature({
    name: "FileManager/DefaultSrcPrefix",
    register(container) {
        container.register(PublicUrlsDefaultSrcPrefix);
    }
});
