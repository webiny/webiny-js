import { createFeature } from "@webiny/feature/api/index.js";
import { ModelSchemaManager } from "./ModelSchemaManager.js";

export const ModelSchemaManagerFeature = createFeature({
    name: "cms.sql.modelSchemaManager",
    register: container => {
        container.register(ModelSchemaManager).inSingletonScope();
    }
});
