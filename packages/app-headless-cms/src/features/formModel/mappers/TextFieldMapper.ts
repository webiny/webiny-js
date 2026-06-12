import type { ICmsFieldTypeMapper } from "../abstractions.js";
import type { IFieldBuilderRegistry } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelField } from "~/types.js";
import { applyFieldProps } from "./applyFieldProps.js";

export class TextFieldMapper implements ICmsFieldTypeMapper {
    readonly type = "text";

    map(field: CmsModelField, registry: IFieldBuilderRegistry) {
        return applyFieldProps(registry.text(), field);
    }
}

export class LongTextFieldMapper implements ICmsFieldTypeMapper {
    readonly type = "long-text";

    map(field: CmsModelField, registry: IFieldBuilderRegistry) {
        return applyFieldProps(registry.text(), field);
    }
}

export class JsonFieldMapper implements ICmsFieldTypeMapper {
    readonly type = "json";

    map(field: CmsModelField, registry: IFieldBuilderRegistry) {
        return applyFieldProps(registry.text(), field);
    }
}
