import { createFeature } from "@webiny/feature/api";
import { ComponentMapGenerator } from "./ComponentMapGenerator.js";

export const ComponentMapGeneratorFeature = createFeature({
    name: "CmsContentModel/ComponentMapGenerator",
    register(container) {
        container.register(ComponentMapGenerator);
    }
});
