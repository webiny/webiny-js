import type { ICmsFieldTypeMapper } from "../abstractions.js";
import type { IFieldBuilderRegistry } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelField } from "~/types.js";
import { applyFieldProps } from "./applyFieldProps.js";

export class DateTimeFieldMapper implements ICmsFieldTypeMapper {
    readonly type = "datetime";

    map(field: CmsModelField, registry: IFieldBuilderRegistry) {
        const builder = registry.datetime();
        return applyFieldProps(builder, field);
    }
}
