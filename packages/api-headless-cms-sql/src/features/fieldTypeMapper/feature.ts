import { createFeature } from "@webiny/feature/api/index.js";
import { FieldTypeMapper } from "./FieldTypeMapper.js";

export const FieldTypeMapperFeature = createFeature({
    name: "cms.sql.fieldTypeMapper",
    register: container => {
        container.register(FieldTypeMapper).inSingletonScope();
    }
});
