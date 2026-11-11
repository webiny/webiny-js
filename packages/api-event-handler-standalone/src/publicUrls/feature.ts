import { createFeature } from "@webiny/feature/api";
import { ConfigPublicUrls } from "./ConfigPublicUrls.js";

export const ConfigPublicUrlsFeature = createFeature({
    name: "ConfigPublicUrlsFeature",
    register(container) {
        container.register(ConfigPublicUrls);
    }
});
