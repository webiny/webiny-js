import { createFeature } from "@webiny/feature/api";
import { NextjsConfig } from "./NextjsConfig.js";
import { NextjsConfigLegacyFallback } from "./NextjsConfigLegacyFallback.js";

export const NextjsFeature = createFeature({
    name: "WebsiteBuilder/Nextjs",
    register(container) {
        container.register(NextjsConfig);
        container.registerDecorator(NextjsConfigLegacyFallback);
    }
});
