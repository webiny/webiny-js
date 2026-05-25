import { createFeature } from "@webiny/feature/api/index.js";
import { SchemaRegistry } from "./SchemaRegistry.js";

export const SchemaRegistryFeature = createFeature({
    name: "cms.sql.schemaRegistry",
    register: container => {
        container.register(SchemaRegistry).inSingletonScope();
    }
});
