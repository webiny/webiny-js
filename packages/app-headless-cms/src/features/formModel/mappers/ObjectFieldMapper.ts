import type { ICmsFieldTypeMapper, ICmsFieldMapperContext } from "../abstractions.js";
import type {
    IFieldBuilder,
    IFieldBuilderRegistry,
    IObjectFieldBuilder
} from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelField } from "~/types.js";
import { applyFieldProps } from "./applyFieldProps.js";

export class ObjectFieldMapper implements ICmsFieldTypeMapper {
    readonly type = "object";

    map(
        field: CmsModelField,
        registry: IFieldBuilderRegistry,
        context: ICmsFieldMapperContext
    ): IFieldBuilder {
        const builder = registry.object() as IObjectFieldBuilder;

        const childFields = field.settings?.fields;
        if (childFields && childFields.length > 0) {
            builder.fields(childRegistry => {
                const result: Record<string, IFieldBuilder> = {};
                for (const child of childFields) {
                    result[child.fieldId] = context.mapField(child, childRegistry);
                }
                return result;
            });
        }

        return applyFieldProps(builder, field);
    }
}
