import type { ICmsFieldTypeMapper } from "../abstractions.js";
import type { IFieldBuilderRegistry } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelField } from "~/types.js";
import { applyFieldProps } from "./applyFieldProps.js";

export class NumberFieldMapper implements ICmsFieldTypeMapper {
    readonly type = "number";

    map(field: CmsModelField, registry: IFieldBuilderRegistry) {
        return applyFieldProps(registry.number(), field);
    }
}
