import type { ICmsFieldTypeMapper } from "../abstractions.js";
import type { IFieldBuilderRegistry } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelField } from "~/types.js";
import { applyFieldProps } from "./applyFieldProps.js";

export class FileFieldMapper implements ICmsFieldTypeMapper {
    readonly type = "file";

    map(field: CmsModelField, registry: IFieldBuilderRegistry) {
        const builder = registry.file();
        return applyFieldProps(builder, field);
    }
}
