import { createFeature } from "@webiny/feature/api";
import { DefaultSlugify } from "./DefaultSlugify.js";

export const SlugifyFeature = createFeature({
    name: "SlugifyFeature",
    register(container) {
        container.register(DefaultSlugify);
    }
});
