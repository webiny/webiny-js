import { createFeature } from "@webiny/feature/admin";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { ModelsCache } from "./abstractions.js";
import type { CmsModel } from "~/types.js";
import { GetModelFeature } from "./getModel/feature.js";
import { ListModelsFeature } from "./listModels/feature.js";
import { CreateModelFeature } from "./createModel/feature.js";
import { CloneModelFeature } from "./cloneModel/feature.js";
import { UpdateModelFeature } from "./updateModel/feature.js";
import { DeleteModelFeature } from "./deleteModel/feature.js";
import { CancelDeleteModelFeature } from "./cancelDeleteModel/feature.js";
import { ExportModelsFeature } from "./exportModels/feature.js";
import { ImportModelsFeature } from "./importModels/feature.js";

export const ModelFeature = createFeature({
    name: "CmsModel",
    register(container) {
        container.registerInstance(ModelsCache, new ListCache<CmsModel>("modelId"));

        GetModelFeature.register(container);
        ListModelsFeature.register(container);
        CreateModelFeature.register(container);
        CloneModelFeature.register(container);
        UpdateModelFeature.register(container);
        DeleteModelFeature.register(container);
        CancelDeleteModelFeature.register(container);
        ExportModelsFeature.register(container);
        ImportModelsFeature.register(container);
    }
});
