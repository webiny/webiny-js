import { createFeature } from "@webiny/feature/api/index.js";
import { SchemaRegistryImplementation } from "./SchemaRegistry.js";
import { FieldTypeMapperImplementation } from "./FieldTypeMapper.js";
import { GroupSchemaManagerImplementation } from "./GroupSchemaManager.js";
import { ModelSchemaManagerImplementation } from "./ModelSchemaManager.js";
import { EntrySchemaManagerImplementation } from "./EntrySchemaManager.js";

export const SchemaFeature = createFeature({
    name: "cms.sql.schema",
    register: container => {
        container.register(SchemaRegistryImplementation).inSingletonScope();
        container.register(FieldTypeMapperImplementation).inSingletonScope();
        container.register(GroupSchemaManagerImplementation).inSingletonScope();
        container.register(ModelSchemaManagerImplementation).inSingletonScope();
        container.register(EntrySchemaManagerImplementation).inSingletonScope();
    }
});
