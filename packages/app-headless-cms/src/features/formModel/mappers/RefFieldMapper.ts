import type { ICmsFieldTypeMapper } from "../abstractions.js";
import type { IFieldBuilderRegistry } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelField } from "~/types.js";
import { applyFieldProps } from "./applyFieldProps.js";

export class RefFieldMapper implements ICmsFieldTypeMapper {
    readonly type = "ref";

    map(field: CmsModelField, registry: IFieldBuilderRegistry) {
        const builder = (registry as any).ref();
        const models = field.settings?.models || [];
        builder.renderer(field.list ? "refInputs" : "refInput", {
            models,
            ...(field.renderer && typeof field.renderer === "object" ? field.renderer.settings : {})
        });
        return applyFieldProps(builder, field);
    }
}
