import { createFeature } from "@webiny/feature/admin";
import { ModelGroupsCache } from "./abstractions.js";
import { ListModelGroupsFeature } from "./listModelGroups/feature.js";
import { GetModelGroupFeature } from "./getModelGroup/feature.js";
import { CreateModelGroupFeature } from "./createModelGroup/feature.js";
import { UpdateModelGroupFeature } from "./updateModelGroup/feature.js";
import { DeleteModelGroupFeature } from "./deleteModelGroup/feature.js";
import type { ModelGroupDto } from "~/features/modelGroup/listModelGroups/abstractions.js";
import { ListCache } from "~/features/ListCache.js";

export const ModelGroupFeature = createFeature({
    name: "CmsModelGroup",
    register(container) {
        container.registerInstance(ModelGroupsCache, new ListCache<ModelGroupDto>());

        ListModelGroupsFeature.register(container);
        GetModelGroupFeature.register(container);
        CreateModelGroupFeature.register(container);
        UpdateModelGroupFeature.register(container);
        DeleteModelGroupFeature.register(container);
    }
});
