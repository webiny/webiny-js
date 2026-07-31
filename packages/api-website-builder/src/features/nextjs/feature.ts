import { createFeature } from "@webiny/feature/api";
import { NextjsConfig } from "./NextjsConfig.js";

export const NextjsFeature = createFeature({
    name: "WebsiteBuilder/Nextjs",
    register(container) {
        container.register(NextjsConfig);
    }
});
