import { createFeature } from "@webiny/feature/admin";
import { ModelsCache } from "./abstractions.js";
import type { CmsModel } from "~/types.js";
import { ListCache } from "~/features/ListCache.js";
import { GetModelFeature } from "./getModel/feature.js";
import { ListModelsFeature } from "./listModels/feature.js";

export const ModelFeature = createFeature({
    name: "CmsModel",
    register(container) {
        container.registerInstance(ModelsCache, new ListCache<CmsModel>("modelId"));

        GetModelFeature.register(container);
        ListModelsFeature.register(container);
    }
});
