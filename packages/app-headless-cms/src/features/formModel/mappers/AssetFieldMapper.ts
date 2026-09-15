import type { ICmsFieldTypeMapper, ICmsFieldMapperContext } from "../abstractions.js";
import type { IFieldBuilderRegistry } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelField } from "~/types.js";
import { applyFieldProps } from "./applyFieldProps.js";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldBuilderRegistry {
        asset(): IFieldBuilder<"asset">;
    }
}

export class AssetFieldMapper implements ICmsFieldTypeMapper {
    readonly type = "asset";

    map(field: CmsModelField, registry: IFieldBuilderRegistry, context: ICmsFieldMapperContext) {
        const builder = registry.asset();
        return applyFieldProps(builder, field, context.rendererMap);
    }
}
