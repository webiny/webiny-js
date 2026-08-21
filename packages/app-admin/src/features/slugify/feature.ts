import { createFeature } from "@webiny/feature/admin";
import { DefaultSlugify } from "./DefaultSlugify.js";

export const SlugifyFeature = createFeature({
    name: "Slugify",
    register(container) {
        container.register(DefaultSlugify).inSingletonScope();
    }
});
