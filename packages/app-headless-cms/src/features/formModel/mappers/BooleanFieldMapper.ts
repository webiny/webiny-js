import type { ICmsFieldTypeMapper, ICmsFieldMapperContext } from "../abstractions.js";
import type { IFieldBuilderRegistry } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelField } from "~/types.js";
import { applyFieldProps } from "./applyFieldProps.js";

export class BooleanFieldMapper implements ICmsFieldTypeMapper {
    readonly type = "boolean";

    map(field: CmsModelField, registry: IFieldBuilderRegistry, context: ICmsFieldMapperContext) {
        return applyFieldProps(registry.boolean(), field, context.rendererMap);
    }
}
