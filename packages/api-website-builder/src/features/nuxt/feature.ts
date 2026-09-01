import { createFeature } from "@webiny/feature/api";
import { NuxtConfig } from "./NuxtConfig.js";

export const NuxtFeature = createFeature({
    name: "WebsiteBuilder/Nuxt",
    register(container) {
        container.register(NuxtConfig);
    }
});
