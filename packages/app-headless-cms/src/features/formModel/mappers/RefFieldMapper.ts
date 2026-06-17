import type { ICmsFieldTypeMapper } from "../abstractions.js";
import type { IFieldBuilderRegistry } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelField } from "~/types.js";
import { applyFieldProps } from "./applyFieldProps.js";
import { mapCmsRendererName } from "../CmsRendererMap.js";

export class RefFieldMapper implements ICmsFieldTypeMapper {
    readonly type = "ref";

    map(field: CmsModelField, registry: IFieldBuilderRegistry) {
        const builder = (registry as any).ref();
        const models = field.settings?.models || [];

        applyFieldProps(builder, field);

        const rendererName =
            field.renderer && typeof field.renderer === "object"
                ? mapCmsRendererName(field.renderer.name) || (field.list ? "refInputs" : "refInput")
                : field.list
                  ? "refInputs"
                  : "refInput";

        const rendererSettings =
            field.renderer && typeof field.renderer === "object"
                ? field.renderer.settings || {}
                : {};

        builder.renderer(rendererName, { ...rendererSettings, models });

        return builder;
    }
}
