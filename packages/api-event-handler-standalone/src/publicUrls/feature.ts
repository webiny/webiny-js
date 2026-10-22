import { createFeature } from "@webiny/feature/api";
import { BuildParamsPublicUrls } from "./BuildParamsPublicUrls.js";

export const BuildParamsPublicUrlsFeature = createFeature({
    name: "BuildParamsPublicUrlsFeature",
    register(container) {
        container.register(BuildParamsPublicUrls);
    }
});
