import type { ICmsFieldTypeMapper } from "../abstractions.js";
import type { IFieldBuilderRegistry } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelField } from "~/types.js";
import { applyFieldProps } from "./applyFieldProps.js";

export class FileFieldMapper implements ICmsFieldTypeMapper {
    readonly type = "file";

    map(field: CmsModelField, registry: IFieldBuilderRegistry) {
        const renderer = field.list ? "cmsMultiFilePicker" : "cmsFilePicker";
        const builder = registry.file().renderer(renderer);
        return applyFieldProps(builder, field);
    }
}
