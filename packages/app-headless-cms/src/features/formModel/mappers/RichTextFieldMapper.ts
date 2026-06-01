import type { ICmsFieldTypeMapper } from "../abstractions.js";
import type { IFieldBuilderRegistry } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelField } from "~/types.js";
import { applyFieldProps } from "./applyFieldProps.js";

export class RichTextFieldMapper implements ICmsFieldTypeMapper {
    readonly type = "rich-text";

    map(field: CmsModelField, registry: IFieldBuilderRegistry) {
        const builder = registry.lexical();
        return applyFieldProps(builder, field);
    }
}
